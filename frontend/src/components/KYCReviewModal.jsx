import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  FileType,
  Image,
  ExternalLink,
  AlertCircle,
  Save,
  X,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { kycHelpers } from '@/utils/kycHelpers';

/**
 * Comprehensive KYC Review Modal
 * Provides document viewing, status management, and detailed review capabilities
 */
const KYCReviewModal = ({ 
  kycRequest, 
  isOpen, 
  onClose, 
  onStatusUpdate,
  adminId = null
}) => {
  const [documentUrl, setDocumentUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('review');
  const [fileInfo, setFileInfo] = useState(null);

  // Initialize reviewer notes from existing data
  useEffect(() => {
    if (kycRequest?.reviewer_notes) {
      setReviewerNotes(kycRequest.reviewer_notes);
    }
  }, [kycRequest?.reviewer_notes]);

  // Load document URL when modal opens
  useEffect(() => {
    if (isOpen && kycRequest?.file_path) {
      loadDocumentUrl();
      loadFileInfo();
    } else {
      // Reset state when modal closes
      setDocumentUrl(null);
      setError('');
      setFileInfo(null);
    }
  }, [isOpen, kycRequest?.file_path]);

  const loadDocumentUrl = async () => {
    if (!kycRequest?.file_path) {
      setError('No document file path found');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { url, error: urlError } = await kycHelpers.getDocumentUrl(
        kycRequest.file_path,
        3600, // expires in 1 hour
        adminId,
        kycRequest.user.id,
        kycRequest.kyc_document_id
      );
      
      if (urlError) {
        setError(`Failed to load document: ${urlError}`);
      } else {
        setDocumentUrl(url);
      }
    } catch (err) {
      setError(`Error loading document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadFileInfo = async () => {
    if (!kycRequest?.file_path) return;

    try {
      const { fileInfo } = await kycHelpers.getFileInfo(kycRequest.file_path);
      setFileInfo(fileInfo);
    } catch (err) {
      console.warn('Failed to load file info:', err);
    }
  };

  const handleDownload = async () => {
    if (!kycRequest?.file_path) return;

    setLoading(true);
    try {
      const fileName = `KYC_${kycRequest.user.grant_number}_${kycRequest.document_type}`;
      const { success, error: downloadError } = await kycHelpers.downloadDocument(
        kycRequest.file_path, 
        fileName,
        adminId,
        kycRequest.user.id,
        kycRequest.kyc_document_id
      );

      if (!success) {
        setError(`Download failed: ${downloadError}`);
      }
    } catch (err) {
      setError(`Download error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!kycRequest) return;

    setSubmitting(true);
    setError('');

    try {
      const { success, error: updateError } = await kycHelpers.updateKycStatus(
        kycRequest.user.id,
        kycRequest.kyc_document_id,
        newStatus,
        reviewerNotes,
        adminId
      );

      if (success) {
        // Call parent callback to refresh the KYC list
        if (onStatusUpdate) {
          onStatusUpdate(kycRequest.user.id, newStatus);
        }
        onClose();
      } else {
        setError(`Failed to update status: ${updateError}`);
      }
    } catch (err) {
      setError(`Update error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFileTypeIcon = () => {
    if (!kycRequest?.file_path) return FileText;
    
    const iconName = kycHelpers.getFileTypeIcon(kycRequest.file_path);
    switch (iconName) {
      case 'Image':
        return Image;
      case 'FileType':
        return FileType;
      default:
        return FileText;
    }
  };

  const isImageFile = () => {
    if (!kycRequest?.file_path) return false;
    const ext = kycRequest.file_path.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png'].includes(ext);
  };

  const isPdfFile = () => {
    if (!kycRequest?.file_path) return false;
    return kycRequest.file_path.toLowerCase().endsWith('.pdf');
  };

  const renderDocumentViewer = () => {
    if (!documentUrl) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="text-center">
            {loading ? (
              <div className="space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-gray-600">Loading document...</p>
              </div>
            ) : error ? (
              <div className="space-y-4">
                <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
                <p className="text-red-600">{error}</p>
                <Button onClick={loadDocumentUrl} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <FileText className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-gray-600">No document available</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (isImageFile()) {
      return (
        <div className="border rounded-lg overflow-hidden">
          <img 
            src={documentUrl} 
            alt="KYC Document" 
            className="w-full max-h-96 object-contain bg-gray-50"
            onError={() => setError('Failed to load image')}
          />
        </div>
      );
    }

    if (isPdfFile()) {
      return (
        <div className="border rounded-lg overflow-hidden h-96">
          <iframe
            src={documentUrl}
            className="w-full h-full"
            title="KYC Document"
            onError={() => setError('Failed to load PDF')}
          />
        </div>
      );
    }

    // For other file types, show preview option
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center space-y-4">
          {React.createElement(getFileTypeIcon(), { className: "h-12 w-12 text-gray-400 mx-auto" })}
          <div>
            <p className="text-gray-600 mb-2">
              Document ready for download
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Preview not available for this file type
            </p>
            <Button onClick={() => window.open(documentUrl, '_blank')} variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (!kycRequest) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {getStatusIcon(kycRequest.status)}
              <span>KYC Review - {kycRequest.user.full_name}</span>
            </div>
            <Badge className={getStatusColor(kycRequest.status)}>
              {kycRequest.status.toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Review KYC submission for grant {kycRequest.grant_award_number}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="review">Review & Actions</TabsTrigger>
            <TabsTrigger value="document">Document View</TabsTrigger>
            <TabsTrigger value="history">History & Details</TabsTrigger>
          </TabsList>

          {/* Review & Actions Tab */}
          <TabsContent value="review" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Full Name:</span>
                    <span className="font-medium">{kycRequest.user.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{kycRequest.user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grant Number:</span>
                    <span className="font-mono text-blue-600">{kycRequest.user.grant_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Status:</span>
                    <Badge variant={kycRequest.account_status === 'active' ? 'default' : 'secondary'}>
                      {kycRequest.account_status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Document Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Document Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Document Type:</span>
                    <span className="font-medium">AML Certificate</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Submitted:</span>
                    <span className="font-medium">
                      {new Date(kycRequest.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                  {kycRequest.reviewed_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reviewed:</span>
                      <span className="font-medium">
                        {new Date(kycRequest.reviewed_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {fileInfo && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">File Size:</span>
                      <span className="font-medium">
                        {kycHelpers.formatFileSize(fileInfo.size)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Actions:</span>
                    <div className="flex space-x-2">
                      <Button onClick={handleDownload} variant="outline" size="sm" disabled={loading}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reviewer Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reviewer Notes</CardTitle>
                <CardDescription>
                  Add notes about this KYC review (visible to other admins)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Enter your review notes here..."
                  rows={4}
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {kycRequest.status === 'pending' && (
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  onClick={() => handleStatusUpdate('rejected')} 
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Reject KYC
                </Button>
                <Button 
                  onClick={() => handleStatusUpdate('approved')} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Approve KYC
                </Button>
              </div>
            )}

            {kycRequest.status !== 'pending' && (
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  onClick={() => handleStatusUpdate('pending')} 
                  variant="outline"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Reset to Pending
                </Button>
                {reviewerNotes !== (kycRequest.reviewer_notes || '') && (
                  <Button 
                    onClick={() => handleStatusUpdate(kycRequest.status)} 
                    variant="outline"
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Notes
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* Document View Tab */}
          <TabsContent value="document" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Document Viewer</h3>
              <div className="flex space-x-2">
                <Button onClick={loadDocumentUrl} variant="outline" size="sm" disabled={loading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={handleDownload} variant="outline" size="sm" disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            
            {renderDocumentViewer()}
          </TabsContent>

          {/* History & Details Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Submission Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Document Submitted</h4>
                      <span className="text-sm text-gray-500">
                        {new Date(kycRequest.submitted_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      User submitted KYC documentation for review
                    </p>
                  </div>
                </div>

                {kycRequest.reviewed_at && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      {getStatusIcon(kycRequest.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Status Updated</h4>
                        <span className="text-sm text-gray-500">
                          {new Date(kycRequest.reviewed_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        KYC status changed to {kycRequest.status}
                      </p>
                      {kycRequest.reviewer_notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <strong>Reviewer Notes:</strong> {kycRequest.reviewer_notes}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Document Count</Label>
                    <p className="font-medium">{kycRequest.document_count} document(s)</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Has Document</Label>
                    <p className="font-medium">{kycRequest.has_document ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">KYC Document ID</Label>
                    <p className="font-mono text-sm">{kycRequest.kyc_document_id || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">User ID</Label>
                    <p className="font-mono text-sm">{kycRequest.user.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer with Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KYCReviewModal;