import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

const AdminDashboardDebug = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState([]);
  const navigate = useNavigate();

  const addDebugInfo = (message) => {
    console.log(message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    debugAdminLoad();
  }, []);

  const debugAdminLoad = async () => {
    addDebugInfo('Starting admin dashboard load...');
    
    try {
      // Step 1: Check session
      addDebugInfo('Checking Supabase session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addDebugInfo(`Session error: ${sessionError.message}`);
        setError('Session error: ' + sessionError.message);
        return;
      }
      
      if (!session) {
        addDebugInfo('No session found, checking localStorage...');
        const adminData = localStorage.getItem('admin');
        if (adminData) {
          addDebugInfo('Found admin data in localStorage');
          setAdmin(JSON.parse(adminData));
          setLoading(false);
          return;
        } else {
          addDebugInfo('No admin data found anywhere, redirecting to login');
          navigate('/admin/login');
          return;
        }
      }

      addDebugInfo(`Session found for user: ${session.user.email}`);

      // Step 2: Get admin profile
      addDebugInfo('Fetching admin profile from database...');
      const { data: adminProfile, error: profileError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (profileError) {
        addDebugInfo(`Admin profile error: ${profileError.message}`);
        setError('Admin profile error: ' + profileError.message);
        return;
      }
      
      if (!adminProfile) {
        addDebugInfo('No admin profile found for this user');
        setError('You are not authorized as an admin');
        return;
      }

      addDebugInfo(`Admin profile loaded: ${adminProfile.username}`);
      setAdmin(adminProfile);

      // Step 3: Test basic data fetch
      addDebugInfo('Testing basic user count...');
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        addDebugInfo(`User count error: ${countError.message}`);
      } else {
        addDebugInfo(`Found ${count} users in database`);
      }

    } catch (err) {
      addDebugInfo(`Unexpected error: ${err.message}`);
      setError('Unexpected error: ' + err.message);
    } finally {
      addDebugInfo('Admin load complete');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('admin');
      navigate('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6">🔧 Admin Dashboard Debug</h1>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p>Loading admin dashboard...</p>
            
            <div className="mt-6 bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Debug Log:</h3>
              <div className="text-sm space-y-1">
                {debugInfo.map((info, index) => (
                  <div key={index} className="text-gray-700">{info}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6 text-red-600">❌ Admin Dashboard Error</h1>
            <div className="bg-red-50 p-4 rounded mb-6">
              <p className="text-red-800">{error}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded mb-6">
              <h3 className="font-semibold mb-2">Debug Log:</h3>
              <div className="text-sm space-y-1">
                {debugInfo.map((info, index) => (
                  <div key={index} className="text-gray-700">{info}</div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => navigate('/admin/login')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-4"
            >
              Back to Login
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">✅ Admin Dashboard (Debug Mode)</h1>
            <button 
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
          
          {admin && (
            <div className="bg-green-50 p-4 rounded mb-6">
              <h2 className="font-semibold mb-2">Admin Info:</h2>
              <p><strong>Username:</strong> {admin.username}</p>
              <p><strong>Email:</strong> {admin.email}</p>
              <p><strong>Role:</strong> {admin.role}</p>
              <p><strong>Status:</strong> {admin.status}</p>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Debug Log:</h3>
            <div className="text-sm space-y-1">
              {debugInfo.map((info, index) => (
                <div key={index} className="text-gray-700">{info}</div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <button 
              onClick={() => navigate('/admin/dashboard')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Try Full Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardDebug;
