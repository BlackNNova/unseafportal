import { supabase } from './supabase.js';
import { auditLogger } from './auditLogger.js';

/**
 * KYC Helper Functions for Document Management
 * Handles document viewing, downloading, and status management
 */

export const kycHelpers = {
  /**
   * Get signed URL for viewing/downloading KYC documents
   * @param {string} filePath - Path to file in Supabase storage
   * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns {Promise<{url: string, error?: string}>}
   */
  getDocumentUrl: async (filePath, expiresIn = 3600, adminId = null, userId = null, kycDocumentId = null) => {
    try {
      console.log('🔗 Getting signed URL for file:', filePath);
      
      const { data, error } = await supabase.storage
        .from('kyc documents') // Note: matching the bucket name from KYCForm
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('❌ Error creating signed URL:', error);
        return { url: null, error: error.message };
      }

      // Log document view for audit trail
      if (adminId && userId) {
        await auditLogger.logDocumentView({
          userId,
          adminId,
          kycDocumentId,
          documentPath: filePath
        });
      }

      console.log('✅ Signed URL created successfully');
      return { url: data.signedUrl, error: null };
    } catch (err) {
      console.error('❌ Exception in getDocumentUrl:', err);
      return { url: null, error: err.message };
    }
  },

  /**
   * Download document to user's device
   * @param {string} filePath - Path to file in Supabase storage
   * @param {string} fileName - Desired filename for download
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  downloadDocument: async (filePath, fileName, adminId = null, userId = null, kycDocumentId = null) => {
    try {
      console.log('💾 Downloading document:', filePath, 'as', fileName);
      
      const { data, error } = await supabase.storage
        .from('kyc documents')
        .download(filePath);

      if (error) {
        console.error('❌ Error downloading file:', error);
        return { success: false, error: error.message };
      }

      // Create blob URL and trigger download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || filePath.split('/').pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log document download for audit trail
      if (adminId && userId) {
        await auditLogger.logDocumentDownload({
          userId,
          adminId,
          kycDocumentId,
          documentPath: filePath
        });
      }

      console.log('✅ Download triggered successfully');
      return { success: true };
    } catch (err) {
      console.error('❌ Exception in downloadDocument:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Get file info from storage
   * @param {string} filePath - Path to file in Supabase storage
   * @returns {Promise<{fileInfo: object, error?: string}>}
   */
  getFileInfo: async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('kyc documents')
        .list(filePath.substring(0, filePath.lastIndexOf('/')), {
          search: filePath.split('/').pop()
        });

      if (error) {
        return { fileInfo: null, error: error.message };
      }

      const fileInfo = data.find(file => filePath.endsWith(file.name));
      return { fileInfo, error: null };
    } catch (err) {
      return { fileInfo: null, error: err.message };
    }
  },

  /**
   * Update KYC status with audit trail
   * @param {string} userId - User ID
   * @param {string} kycId - KYC document ID  
   * @param {string} newStatus - New status ('approved', 'rejected', 'pending')
   * @param {string} reviewerNotes - Admin notes
   * @param {string} adminId - Admin user ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  updateKycStatus: async (userId, kycId, newStatus, reviewerNotes = '', adminId = null) => {
    try {
      console.log('🔄 Updating KYC status:', { userId, kycId, newStatus, reviewerNotes });

      // Get current status for audit logging
      const { data: currentUser, error: getCurrentError } = await supabase
        .from('users')
        .select('kyc_status')
        .eq('id', userId)
        .single();

      const oldStatus = currentUser?.kyc_status || 'unknown';

      // Update user's kyc_status
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          kyc_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (userError) {
        throw userError;
      }

      // Update kyc_documents record if kycId provided
      if (kycId) {
        const updateData = {
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: reviewerNotes
        };

        if (adminId) {
          updateData.reviewed_by = adminId;
        }

        const { error: kycError } = await supabase
          .from('kyc_documents')
          .update(updateData)
          .eq('id', kycId);

        if (kycError) {
          console.warn('⚠️ Failed to update kyc_documents:', kycError);
          // Don't throw - user status was updated successfully
        }
      }

      // Log the status change for audit trail
      if (adminId) {
        await auditLogger.logKycStatusChange({
          userId,
          adminId,
          action: newStatus,
          oldStatus,
          newStatus,
          notes: reviewerNotes,
          kycDocumentId: kycId
        });
      }

      console.log('✅ KYC status updated successfully');
      return { success: true };
    } catch (err) {
      console.error('❌ Error updating KYC status:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Fetch comprehensive KYC requests with user details and documents
   * @param {string} statusFilter - Filter by status ('all', 'pending', 'approved', 'rejected')
   * @param {object} options - Additional options { limit, offset, search }
   * @returns {Promise<{kycRequests: array, totalCount: number, error?: string}>}
   */
  fetchKycRequests: async (statusFilter = 'all', options = {}) => {
    try {
      const { limit = 50, offset = 0, search = '' } = options;
      
      console.log('🔍 Fetching KYC requests:', { statusFilter, limit, offset, search });

      // Build query for users with KYC data
      let usersQuery = supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          full_name,
          grant_number,
          kyc_status,
          account_status,
          created_at,
          updated_at
        `);

      // Apply status filter
      if (statusFilter !== 'all') {
        usersQuery = usersQuery.eq('kyc_status', statusFilter);
      } else {
        // Exclude users who haven't submitted KYC yet
        usersQuery = usersQuery.neq('kyc_status', 'not_submitted');
      }

      // Apply search filter
      if (search.trim()) {
        usersQuery = usersQuery.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,grant_number.ilike.%${search}%`
        );
      }

      // Apply pagination
      usersQuery = usersQuery
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: users, error: usersError, count } = await usersQuery;

      if (usersError) {
        throw usersError;
      }

      console.log(`📊 Found ${users?.length || 0} users`);

      // Fetch KYC documents for these users
      const userIds = users?.map(user => user.id) || [];
      
      let kycDocuments = [];
      if (userIds.length > 0) {
        const { data: docs, error: docsError } = await supabase
          .from('kyc_documents')
          .select(`
            id,
            user_id,
            document_type,
            file_path,
            status,
            grant_award_number,
            submitted_at,
            reviewed_at,
            reviewer_notes,
            reviewed_by,
            created_at
          `)
          .in('user_id', userIds)
          .order('created_at', { ascending: false });

        if (docsError) {
          console.warn('⚠️ Error fetching KYC documents:', docsError);
        } else {
          kycDocuments = docs || [];
        }
      }

      // Combine user data with their latest KYC document
      const kycRequests = users?.map(user => {
        const userDocs = kycDocuments.filter(doc => doc.user_id === user.id);
        const latestDoc = userDocs[0]; // Already sorted by created_at desc

        return {
          id: user.id,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            grant_number: user.grant_number
          },
          status: user.kyc_status,
          account_status: user.account_status,
          grant_award_number: latestDoc?.grant_award_number || user.grant_number,
          kyc_document_id: latestDoc?.id || null,
          document_type: latestDoc?.document_type || 'aml_certificate',
          file_path: latestDoc?.file_path || null,
          submitted_at: latestDoc?.submitted_at || latestDoc?.created_at || user.created_at,
          reviewed_at: latestDoc?.reviewed_at || null,
          reviewer_notes: latestDoc?.reviewer_notes || '',
          reviewed_by: latestDoc?.reviewed_by || null,
          has_document: !!latestDoc,
          document_count: userDocs.length
        };
      }) || [];

      console.log('✅ KYC requests compiled successfully:', kycRequests.length);
      
      return { 
        kycRequests, 
        totalCount: count || kycRequests.length,
        error: null 
      };
    } catch (err) {
      console.error('❌ Error fetching KYC requests:', err);
      return { 
        kycRequests: [], 
        totalCount: 0, 
        error: err.message 
      };
    }
  },

  /**
   * Get KYC statistics for dashboard
   * @returns {Promise<{stats: object, error?: string}>}
   */
  getKycStats: async () => {
    try {
      console.log('📈 Fetching KYC statistics...');

      const { data, error } = await supabase
        .from('users')
        .select('kyc_status, account_status')
        .neq('kyc_status', 'not_submitted');

      if (error) {
        throw error;
      }

      const stats = {
        total: data.length,
        pending: data.filter(u => u.kyc_status === 'pending').length,
        approved: data.filter(u => u.kyc_status === 'approved').length,
        rejected: data.filter(u => u.kyc_status === 'rejected').length,
        approval_rate: 0,
        avg_review_time: 'N/A' // TODO: Calculate from kyc_documents table
      };

      if (stats.total > 0) {
        stats.approval_rate = ((stats.approved / stats.total) * 100).toFixed(1);
      }

      console.log('✅ KYC stats calculated:', stats);
      return { stats, error: null };
    } catch (err) {
      console.error('❌ Error fetching KYC stats:', err);
      return { stats: null, error: err.message };
    }
  },

  /**
   * Bulk update KYC status for multiple users
   * @param {Array<string>} userIds - Array of user IDs
   * @param {string} newStatus - New status to apply
   * @param {string} reviewerNotes - Notes to apply to all
   * @param {string} adminId - Admin performing the action
   * @returns {Promise<{success: boolean, results: array, error?: string}>}
   */
  bulkUpdateKycStatus: async (userIds, newStatus, reviewerNotes = '', adminId = null) => {
    try {
      console.log('📦 Bulk updating KYC status for', userIds.length, 'users');

      const results = [];
      
      // Update users table
      const { error: usersError } = await supabase
        .from('users')
        .update({ 
          kyc_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', userIds);

      if (usersError) {
        throw usersError;
      }

      // Update kyc_documents table
      const updateData = {
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: reviewerNotes
      };

      if (adminId) {
        updateData.reviewed_by = adminId;
      }

      const { error: docsError } = await supabase
        .from('kyc_documents')
        .update(updateData)
        .in('user_id', userIds);

      if (docsError) {
        console.warn('⚠️ Some KYC documents not updated:', docsError);
      }

      // Log bulk action for audit trail
      if (adminId) {
        await auditLogger.logBulkAction({
          userIds,
          adminId,
          action: newStatus,
          notes: reviewerNotes
        });
      }

      console.log('✅ Bulk KYC status update completed');
      return { 
        success: true, 
        results: userIds.map(id => ({ userId: id, success: true }))
      };
    } catch (err) {
      console.error('❌ Error in bulk KYC update:', err);
      return { 
        success: false, 
        results: [],
        error: err.message 
      };
    }
  },

  /**
   * Validate file type for KYC documents
   * @param {File} file - File object to validate
   * @returns {boolean}
   */
  isValidDocumentType: (file) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/jpg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
    
    const hasValidType = allowedTypes.includes(file.type);
    const hasValidExtension = allowedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    return hasValidType || hasValidExtension;
  },

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string}
   */
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Get file type icon for display
   * @param {string} fileName - Name of the file
   * @returns {string} - Icon name for lucide-react
   */
  getFileTypeIcon: (fileName) => {
    const ext = fileName.toLowerCase().split('.').pop();
    
    switch (ext) {
      case 'pdf':
        return 'FileText';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'Image';
      case 'doc':
      case 'docx':
        return 'FileType';
      default:
        return 'File';
    }
  }
};

export default kycHelpers;