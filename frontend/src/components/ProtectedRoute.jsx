import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../utils/supabase';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
    
    // 🔒 SECURITY: Set up GENTLE periodic account status checks during active sessions
    // Only check every 5 minutes to avoid disrupting user experience
    // Admin status changes will take effect on next page load or after 5 minutes
    const statusCheckInterval = setInterval(async () => {
      try {
        const session = await auth.getSession();
        if (session && isAuthenticated) {
          const profile = await auth.getCurrentUser();
          if (profile) {
            const validStatuses = ['approved', 'active'];
            if (!validStatuses.includes(profile.account_status)) {
              console.log('🚫 SECURITY: Account status changed during session - Forcing logout');
              await auth.signOut();
              setIsAuthenticated(false);
            }
          }
        }
      } catch (error) {
        // Network errors or temporary issues should NOT log user out
        console.warn('Status check encountered error (ignoring):', error);
      }
    }, 300000); // Check every 5 minutes (300,000ms) - much gentler than 10 seconds
    
    return () => clearInterval(statusCheckInterval);
  }, [isAuthenticated]);

  const checkAuthentication = async () => {
    console.log('🧪 TEST: ProtectedRoute - Checking authentication after refresh');
    try {
      // Check if user is authenticated with Supabase
      const session = await auth.getSession();
      console.log('🧪 TEST: ProtectedRoute - Session found:', !!session);
      
      if (session) {
        // Verify we have user profile data too
        const profile = await auth.getCurrentUser();
        console.log('🧪 TEST: ProtectedRoute - Profile found:', !!profile);
        if (profile) {
          // 🔒 CRITICAL SECURITY CHECK: Validate account status
          const accountStatus = profile.account_status;
          console.log('🔐 SECURITY: Checking account status during session validation:', accountStatus);
          
          // Only allow approved accounts to stay logged in
          const validStatuses = ['approved', 'active']; // Support both for backward compatibility
          
          if (validStatuses.includes(accountStatus)) {
            console.log('✅ SECURITY: Account status valid - User can stay logged in');
            setIsAuthenticated(true);
          } else {
            console.log('🚫 SECURITY: Account status invalid - Forcing logout. Status:', accountStatus);
            // Force logout for invalid account status
            await auth.signOut();
            setIsAuthenticated(false);
          }
        } else {
          console.log('🧪 TEST: ProtectedRoute - No profile found');
          setIsAuthenticated(false);
        }
      } else {
        console.log('🧪 TEST: ProtectedRoute - No session found');
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('🧪 TEST: ProtectedRoute - Auth check error:', err);
      setIsAuthenticated(false);
    } finally {
      console.log('🧪 TEST: ProtectedRoute - Auth check complete, authenticated:', isAuthenticated);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

