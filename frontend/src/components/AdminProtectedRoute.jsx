import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

const AdminProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAuthentication();
  }, []);

  const checkAdminAuthentication = async () => {
    console.log('🧪 TEST: AdminProtectedRoute - Checking admin authentication after refresh');
    try {
      // Check if user is signed in with Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🧪 TEST: AdminProtectedRoute - Session found:', !!session);
      
      if (sessionError || !session) {
        console.log('🧪 TEST: AdminProtectedRoute - No session or session error');
        setIsAuthenticated(false);
        return;
      }

      console.log('🧪 TEST: AdminProtectedRoute - Checking admin profile for user:', session.user.email);
      // Check if the user is an admin in the admins table
      const { data: adminProfile, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (adminError || !adminProfile) {
        console.log('🧪 TEST: AdminProtectedRoute - No admin profile, checking localStorage');
        // Also check localStorage for admin data (fallback)
        const adminData = localStorage.getItem('admin');
        if (adminData) {
          console.log('🧪 TEST: AdminProtectedRoute - Admin data found in localStorage');
          setIsAuthenticated(true);
        } else {
          console.log('🧪 TEST: AdminProtectedRoute - No admin data found anywhere');
          setIsAuthenticated(false);
        }
      } else {
        console.log('🧪 TEST: AdminProtectedRoute - Admin profile found, authentication successful');
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('🧪 TEST: AdminProtectedRoute - Auth check error:', err);
      setIsAuthenticated(false);
    } finally {
      console.log('🧪 TEST: AdminProtectedRoute - Auth check complete, authenticated:', isAuthenticated);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Checking admin authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;