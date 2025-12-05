import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle
} from 'lucide-react';
import { supabase, auth } from '@/utils/supabase';

const KYCForm = () => {
  const [formData, setFormData] = useState({
    grant_award_number: '',
    aml_certificate: null
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [kycStatus, setKycStatus] = useState(null);
  const [previousKycStatus, setPreviousKycStatus] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    fetchUserInfo();
    fetchKYCStatus();
    
    // Poll for KYC status updates every 20 seconds if status is pending
    const interval = setInterval(() => {
      if (kycStatus?.kyc_status === 'pending') {
        fetchKYCStatus();
      }
    }, 20000); // Poll every 20 seconds
    
    return () => clearInterval(interval);
  }, [kycStatus?.kyc_status]);
  
  const fetchUserInfo = async () => {
    try {
      const userData = await auth.getCurrentUser();
      
      if (userData) {
        console.log('User data from Supabase:', userData);
        console.log('Grant number:', userData.grant_number);
        setUserInfo(userData);
        // Auto-populate grant number
        setFormData(prev => ({
          ...prev,
          grant_award_number: userData.grant_number || ''
        }));
        console.log('Form data updated with grant number:', userData.grant_number);
      } else {
        console.error('Failed to fetch user info: No user data');
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
    }
  };

  const fetchKYCStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Get KYC status from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('kyc_status')
        .eq('id', user.id)
        .single();
        
      if (userError) {
        console.error('Failed to fetch KYC status:', userError);
        return;
      }
      
      // Get KYC document details if exists
      const { data: kycDoc, error: kycError } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      const data = {
        kyc_status: userData.kyc_status || 'not_submitted',
        kyc_document: kycDoc
      };
        
      // Check if status has changed from pending to approved/rejected
      if (previousKycStatus === 'pending' && data.kyc_status !== 'pending') {
        if (data.kyc_status === 'approved') {
          setMessage('Congratulations! Your KYC verification has been approved.');
          setMessageType('success');
          // Clear message after 10 seconds
          setTimeout(() => {
            setMessage('');
            setMessageType('');
          }, 10000);
        } else if (data.kyc_status === 'rejected') {
          setMessage('Your KYC verification was rejected. Please review the requirements and resubmit your documents.');
          setMessageType('error');
          // Clear message after 10 seconds
          setTimeout(() => {
            setMessage('');
            setMessageType('');
          }, 10000);
        }
      }
      
      setPreviousKycStatus(data.kyc_status);
      setKycStatus(data);
    } catch (err) {
      console.error('Failed to fetch KYC status:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        aml_certificate: file
      }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFormData(prev => ({
        ...prev,
        aml_certificate: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!formData.grant_award_number.trim()) {
      setMessage('Grant number could not be loaded from your account. Please refresh the page.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (!formData.aml_certificate) {
      setMessage('AML Certificate file is required');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('User not authenticated. Please login again.');
        setMessageType('error');
        setLoading(false);
        return;
      }

      // Upload file to Supabase Storage
      const fileExt = formData.aml_certificate.name.split('.').pop();
      const fileName = `${user.id}/aml-certificate-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kyc documents')
        .upload(fileName, formData.aml_certificate);
        
      if (uploadError) {
        console.error('File upload error:', uploadError);
        setMessage('Failed to upload file. Please try again.');
        setMessageType('error');
        setLoading(false);
        return;
      }

      // Insert KYC document record with file path
      const kycData = {
        user_id: user.id,
        document_type: 'aml_certificate',
        file_path: uploadData.path,
        status: 'pending',
        grant_award_number: formData.grant_award_number
        // created_at and submitted_at will auto-populate
      };
      
      console.log('Inserting KYC data:', kycData);
      
      const { data: insertData, error: insertError } = await supabase
        .from('kyc_documents')
        .insert(kycData)
        .select()
        .single();
        
      if (insertError) {
        console.error('Database insert error:', insertError);
        console.error('Insert error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        setMessage(`Failed to save KYC document: ${insertError.message}. Please try again.`);
        setMessageType('error');
        setLoading(false);
        return;
      }
      
      // Update user's KYC status to pending
      const { error: updateError } = await supabase
        .from('users')
        .update({ kyc_status: 'pending' })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('User status update error:', updateError);
      }

      setMessage('KYC documents submitted successfully! Your submission is under review.');
      setMessageType('success');
      setFormData(prev => ({
        grant_award_number: prev.grant_award_number, // Keep the grant number
        aml_certificate: null // Clear the file
      }));
      // Refresh KYC status
      fetchKYCStatus();
    } catch (err) {
      console.error('Submission error:', err);
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">KYC Form</CardTitle>
          <CardDescription>
            Submit your Know Your Customer documents for verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Current KYC Status */}
          {kycStatus && kycStatus.kyc_status !== 'not_submitted' && (
            <Alert className={`mb-6 ${getStatusColor(kycStatus.kyc_status)}`}>
              <div className="flex items-center space-x-2">
                {getStatusIcon(kycStatus.kyc_status)}
                <AlertDescription>
                  <strong>Current Status: </strong>
                  {kycStatus.kyc_status === 'approved' && 'Your KYC documents have been approved.'}
                  {kycStatus.kyc_status === 'pending' && 'Your KYC documents are under review.'}
                  {kycStatus.kyc_status === 'rejected' && 'Your KYC documents were rejected. Please resubmit.'}
                  {kycStatus.kyc_document && (
                      <span className="block mt-1 text-sm">
                        Grant Number: {kycStatus.kyc_document.grant_award_number}
                      </span>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Show form only if not approved or if no submission yet */}
          {(!kycStatus || (kycStatus.kyc_status !== 'approved' && kycStatus.kyc_status !== 'pending')) && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Grant Award Number */}
              <div className="space-y-2">
                <Label htmlFor="grant_award_number" className="text-sm font-medium">
                  Grant Number
                </Label>
                <Input
                  id="grant_award_number"
                  name="grant_award_number"
                  type="text"
                  value={formData.grant_award_number}
                  placeholder="Loading your grant number..."
                  className="w-full bg-gray-50"
                  disabled
                  readOnly
                />
                <p className="text-xs text-gray-500">
                  This field is automatically populated from your account information
                </p>
              </div>

              {/* AML Certificate Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  AML Certificate <span className="text-red-500">*</span>
                </Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="aml_certificate"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    className="hidden"
                  />
                  
                  {formData.aml_certificate ? (
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-600">
                          {formData.aml_certificate.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(formData.aml_certificate.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600 mb-2">
                        Drag and drop your file here, or{' '}
                        <label
                          htmlFor="aml_certificate"
                          className="text-orange-600 hover:text-orange-700 cursor-pointer font-medium"
                        >
                          choose file
                        </label>
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-orange-600">
                  Supported types: jpg, jpeg, png, pdf, doc, docx
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  'Submit'
                )}
              </Button>
            </form>
          )}

          {/* Success/Error Messages */}
          {message && (
            <Alert className={`mt-4 ${
              messageType === 'success' 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <AlertDescription className={
                messageType === 'success' ? 'text-green-800' : 'text-red-800'
              }>
                {message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KYCForm;

