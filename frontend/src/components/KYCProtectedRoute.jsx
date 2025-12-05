import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, XCircle } from 'lucide-react';

/**
 * KYCProtectedRoute - Route wrapper that enforces KYC verification
 * 
 * This component protects routes that require approved KYC status.
 * Users must have kyc_status === 'approved' to access wrapped routes.
 * 
 * Usage:
 * <Route path="/withdrawals/new" element={
 *   <KYCProtectedRoute>
 *     <WithdrawalPage />
 *   </KYCProtectedRoute>
 * } />
 */
const KYCProtectedRoute = ({ children }) => {
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    checkKYCStatus();
  }, []);

  const checkKYCStatus = async () => {
    console.log('🔒 KYC Protection: Checking KYC status...');
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('❌ KYC Protection: No authenticated user found');
        setKycStatus('not_authenticated');
        setLoading(false);
        return;
      }

      console.log('✅ KYC Protection: User authenticated, fetching profile...');

      // Fetch user profile with KYC status
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, kyc_status, account_status')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('❌ KYC Protection: Failed to fetch user profile:', profileError);
        setKycStatus('error');
        setLoading(false);
        return;
      }

      console.log('📋 KYC Protection: User profile loaded:', {
        email: profile.email,
        kyc_status: profile.kyc_status,
        account_status: profile.account_status
      });

      setUserInfo(profile);
      setKycStatus(profile.kyc_status || 'not_submitted');
      setLoading(false);

    } catch (err) {
      console.error('💥 KYC Protection: Exception during KYC check:', err);
      setKycStatus('error');
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying KYC status...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (kycStatus === 'not_authenticated') {
    console.log('🚫 KYC Protection: Redirecting to login - user not authenticated');
    return <Navigate to="/login" replace />;
  }

  // KYC approved - allow access
  if (kycStatus === 'approved') {
    console.log('✅ KYC Protection: Access granted - KYC approved');
    return children;
  }

  // KYC not approved - show appropriate message and redirect
  console.log('🚫 KYC Protection: Access denied - KYC status:', kycStatus);

  const getStatusMessage = () => {
    switch (kycStatus) {
      case 'pending':
        return {
          title: 'KYC Verification Pending',
          message: 'Your KYC documents are currently under review. You will be able to access this feature once your verification is approved.',
          icon: AlertCircle,
          color: 'orange'
        };
      case 'rejected':
        return {
          title: 'KYC Verification Rejected',
          message: 'Your KYC documents were rejected. Please resubmit your documents from the Dashboard to access this feature.',
          icon: XCircle,
          color: 'red'
        };
      case 'not_submitted':
        return {
          title: 'KYC Verification Required',
          message: 'You need to complete KYC verification to access this feature. Please submit your documents from the Dashboard.',
          icon: AlertCircle,
          color: 'blue'
        };
      default:
        return {
          title: 'Access Restricted',
          message: 'You do not have permission to access this feature. Please contact support if you believe this is an error.',
          icon: XCircle,
          color: 'red'
        };
    }
  };

  const statusInfo = getStatusMessage();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <Alert className={`border-${statusInfo.color}-200 bg-${statusInfo.color}-50 mb-6`}>
          <StatusIcon className={`h-5 w-5 text-${statusInfo.color}-600`} />
          <AlertDescription className={`text-${statusInfo.color}-800`}>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">{statusInfo.title}</h3>
              <p>{statusInfo.message}</p>
            </div>
            
            {userInfo && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Your Account Status:</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Email:</span> {userInfo.email}</p>
                  <p><span className="font-medium">Name:</span> {userInfo.first_name} {userInfo.last_name}</p>
                  <p><span className="font-medium">KYC Status:</span> <span className="capitalize">{kycStatus}</span></p>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
              {kycStatus === 'rejected' || kycStatus === 'not_submitted' ? (
                <button
                  onClick={() => window.location.href = '/dashboard?tab=kyc'}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Submit KYC Documents
                </button>
              ) : null}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default KYCProtectedRoute;
