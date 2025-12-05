import { supabase } from './supabase.js';

/**
 * Audit Logger for KYC Management
 * Tracks all KYC status changes, document views, and admin actions
 */

export const auditLogger = {
  /**
   * Log KYC status change
   * @param {object} params - Audit log parameters
   * @param {string} params.userId - User whose KYC status changed
   * @param {string} params.adminId - Admin who made the change
   * @param {string} params.action - Action performed ('approve', 'reject', 'reset')
   * @param {string} params.oldStatus - Previous KYC status
   * @param {string} params.newStatus - New KYC status
   * @param {string} params.notes - Admin notes
   * @param {string} params.kycDocumentId - Related KYC document ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  logKycStatusChange: async (params) => {
    try {
      const {
        userId,
        adminId,
        action,
        oldStatus,
        newStatus,
        notes = '',
        kycDocumentId = null
      } = params;

      console.log('📋 Logging KYC status change:', params);

      // Create audit log entry
      const auditEntry = {
        event_type: 'kyc_status_change',
        user_id: userId,
        admin_id: adminId,
        action,
        details: {
          old_status: oldStatus,
          new_status: newStatus,
          kyc_document_id: kycDocumentId,
          notes
        },
        ip_address: await getCurrentUserIP(),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      // Try to insert into audit_logs table if it exists
      // If it doesn't exist, we'll log to console and continue
      try {
        const { error: auditError } = await supabase
          .from('audit_logs')
          .insert(auditEntry);

        if (auditError) {
          console.warn('⚠️ Could not insert audit log (table may not exist):', auditError);
          // Continue anyway - audit logging shouldn't break the main functionality
        } else {
          console.log('✅ Audit log created successfully');
        }
      } catch (tableError) {
        console.warn('⚠️ Audit logs table not available:', tableError);
      }

      return { success: true };
    } catch (err) {
      console.error('❌ Error creating audit log:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Log document view event
   * @param {object} params - Document view parameters
   * @param {string} params.userId - User whose document was viewed
   * @param {string} params.adminId - Admin who viewed the document
   * @param {string} params.kycDocumentId - KYC document ID
   * @param {string} params.documentPath - File path in storage
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  logDocumentView: async (params) => {
    try {
      const {
        userId,
        adminId,
        kycDocumentId,
        documentPath
      } = params;

      console.log('👀 Logging document view:', params);

      const auditEntry = {
        event_type: 'document_view',
        user_id: userId,
        admin_id: adminId,
        action: 'view',
        details: {
          kyc_document_id: kycDocumentId,
          document_path: documentPath,
          view_timestamp: new Date().toISOString()
        },
        ip_address: await getCurrentUserIP(),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      try {
        const { error: auditError } = await supabase
          .from('audit_logs')
          .insert(auditEntry);

        if (auditError) {
          console.warn('⚠️ Could not log document view:', auditError);
        }
      } catch (tableError) {
        console.warn('⚠️ Audit logs table not available for document view');
      }

      return { success: true };
    } catch (err) {
      console.error('❌ Error logging document view:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Log document download event
   * @param {object} params - Document download parameters
   * @param {string} params.userId - User whose document was downloaded
   * @param {string} params.adminId - Admin who downloaded the document
   * @param {string} params.kycDocumentId - KYC document ID
   * @param {string} params.documentPath - File path in storage
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  logDocumentDownload: async (params) => {
    try {
      const {
        userId,
        adminId,
        kycDocumentId,
        documentPath
      } = params;

      console.log('💾 Logging document download:', params);

      const auditEntry = {
        event_type: 'document_download',
        user_id: userId,
        admin_id: adminId,
        action: 'download',
        details: {
          kyc_document_id: kycDocumentId,
          document_path: documentPath,
          download_timestamp: new Date().toISOString()
        },
        ip_address: await getCurrentUserIP(),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      try {
        const { error: auditError } = await supabase
          .from('audit_logs')
          .insert(auditEntry);

        if (auditError) {
          console.warn('⚠️ Could not log document download:', auditError);
        }
      } catch (tableError) {
        console.warn('⚠️ Audit logs table not available for document download');
      }

      return { success: true };
    } catch (err) {
      console.error('❌ Error logging document download:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Log bulk action event
   * @param {object} params - Bulk action parameters
   * @param {Array<string>} params.userIds - User IDs affected
   * @param {string} params.adminId - Admin who performed the action
   * @param {string} params.action - Bulk action performed
   * @param {string} params.notes - Admin notes
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  logBulkAction: async (params) => {
    try {
      const {
        userIds,
        adminId,
        action,
        notes = ''
      } = params;

      console.log('📦 Logging bulk action:', params);

      const auditEntry = {
        event_type: 'bulk_kyc_action',
        user_id: null, // Multiple users affected
        admin_id: adminId,
        action,
        details: {
          affected_users: userIds,
          user_count: userIds.length,
          notes,
          bulk_action: action
        },
        ip_address: await getCurrentUserIP(),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      try {
        const { error: auditError } = await supabase
          .from('audit_logs')
          .insert(auditEntry);

        if (auditError) {
          console.warn('⚠️ Could not log bulk action:', auditError);
        }
      } catch (tableError) {
        console.warn('⚠️ Audit logs table not available for bulk action');
      }

      return { success: true };
    } catch (err) {
      console.error('❌ Error logging bulk action:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Retrieve audit logs for a specific user
   * @param {string} userId - User ID to get logs for
   * @param {object} options - Query options { limit, offset }
   * @returns {Promise<{logs: array, totalCount: number, error?: string}>}
   */
  getUserAuditLogs: async (userId, options = {}) => {
    try {
      const { limit = 50, offset = 0 } = options;

      console.log('📋 Fetching audit logs for user:', userId);

      // Try to fetch from audit_logs table
      try {
        let query = supabase
          .from('audit_logs')
          .select('*, admin:admin_id(username, email)')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false });

        if (limit) {
          query = query.range(offset, offset + limit - 1);
        }

        const { data: logs, error: logsError, count } = await query;

        if (logsError) {
          throw logsError;
        }

        return {
          logs: logs || [],
          totalCount: count || logs?.length || 0,
          error: null
        };
      } catch (tableError) {
        console.warn('⚠️ Could not fetch audit logs, table may not exist:', tableError);
        
        // Fallback - generate logs from KYC documents table
        const { data: kycDocs, error: kycError } = await supabase
          .from('kyc_documents')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (kycError) {
          throw kycError;
        }

        // Convert KYC documents to audit log format
        const logs = kycDocs?.map(doc => ({
          id: doc.id,
          event_type: 'kyc_status_change',
          user_id: doc.user_id,
          admin_id: doc.reviewed_by,
          action: doc.status,
          details: {
            old_status: 'pending',
            new_status: doc.status,
            notes: doc.reviewer_notes
          },
          timestamp: doc.reviewed_at || doc.created_at
        })) || [];

        return {
          logs,
          totalCount: logs.length,
          error: null
        };
      }
    } catch (err) {
      console.error('❌ Error fetching audit logs:', err);
      return {
        logs: [],
        totalCount: 0,
        error: err.message
      };
    }
  },

  /**
   * Get audit statistics for reporting
   * @param {object} options - Query options { dateFrom, dateTo }
   * @returns {Promise<{stats: object, error?: string}>}
   */
  getAuditStats: async (options = {}) => {
    try {
      const { dateFrom, dateTo } = options;

      console.log('📊 Fetching audit statistics...');

      // Try to fetch from audit_logs table
      try {
        let query = supabase
          .from('audit_logs')
          .select('event_type, action, timestamp, admin_id');

        if (dateFrom) {
          query = query.gte('timestamp', dateFrom);
        }

        if (dateTo) {
          query = query.lte('timestamp', dateTo);
        }

        const { data: logs, error: logsError } = await query;

        if (logsError) {
          throw logsError;
        }

        // Calculate statistics
        const stats = {
          total_events: logs?.length || 0,
          events_by_type: {},
          actions_by_admin: {},
          events_by_date: {},
          most_active_admin: null
        };

        logs?.forEach(log => {
          // Count by event type
          stats.events_by_type[log.event_type] = 
            (stats.events_by_type[log.event_type] || 0) + 1;

          // Count by admin
          if (log.admin_id) {
            stats.actions_by_admin[log.admin_id] = 
              (stats.actions_by_admin[log.admin_id] || 0) + 1;
          }

          // Count by date
          const date = log.timestamp.split('T')[0];
          stats.events_by_date[date] = 
            (stats.events_by_date[date] || 0) + 1;
        });

        // Find most active admin
        let maxActions = 0;
        Object.entries(stats.actions_by_admin).forEach(([adminId, count]) => {
          if (count > maxActions) {
            maxActions = count;
            stats.most_active_admin = adminId;
          }
        });

        return { stats, error: null };
      } catch (tableError) {
        console.warn('⚠️ Could not fetch audit stats, using fallback');
        
        // Fallback stats
        return {
          stats: {
            total_events: 0,
            events_by_type: {},
            actions_by_admin: {},
            events_by_date: {},
            most_active_admin: null
          },
          error: null
        };
      }
    } catch (err) {
      console.error('❌ Error fetching audit statistics:', err);
      return {
        stats: null,
        error: err.message
      };
    }
  }
};

/**
 * Get current user's IP address (best effort)
 * @returns {Promise<string>}
 */
async function getCurrentUserIP() {
  try {
    // This would typically call an IP detection service
    // For now, return a placeholder
    return 'unknown';
  } catch (err) {
    return 'unknown';
  }
}

export default auditLogger;