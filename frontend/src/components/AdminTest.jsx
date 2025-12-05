import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Link } from 'react-router-dom';

const AdminTest = () => {
  const [session, setSession] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
    fetchAdmins();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
  };

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*');
      
      if (error) {
        console.error('Error fetching admins:', error);
      } else {
        setAdmins(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">🔧 Admin Debug Page</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Session Info */}
            <div className="bg-blue-50 p-4 rounded">
              <h2 className="font-semibold mb-2">Current Session:</h2>
              {session ? (
                <div className="text-sm">
                  <p><strong>User ID:</strong> {session.user.id}</p>
                  <p><strong>Email:</strong> {session.user.email}</p>
                  <p><strong>Logged in:</strong> ✅</p>
                </div>
              ) : (
                <p className="text-gray-600">No active session</p>
              )}
            </div>

            {/* Admins Table */}
            <div className="bg-green-50 p-4 rounded">
              <h2 className="font-semibold mb-2">Admins in Database:</h2>
              {loading ? (
                <p>Loading...</p>
              ) : admins.length > 0 ? (
                <div className="text-sm">
                  {admins.map(admin => (
                    <div key={admin.id} className="mb-2 p-2 bg-white rounded">
                      <p><strong>{admin.username}</strong></p>
                      <p>{admin.email}</p>
                      <p>Status: {admin.status}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-red-600">No admins found</p>
              )}
            </div>
          </div>

          <div className="mt-6 space-x-4">
            <Link to="/admin/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Go to Admin Login
            </Link>
            <Link to="/login" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              Go to User Login
            </Link>
            <Link to="/" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTest;
