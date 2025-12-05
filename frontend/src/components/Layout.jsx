import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  ArrowLeftRight, 
  History, 
  MessageSquare, 
  Settings, 
  LogOut,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { supabase } from '../utils/supabase';

const Layout = ({ children }) => {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Get current user from Supabase auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        // Don't redirect - ProtectedRoute handles authentication
        console.warn('No user found in Layout');
        return;
      }

      // Get user profile from users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Failed to fetch user profile:', profileError);
        // Don't redirect on profile fetch error - might be temporary
        return;
      }

      setUser(profile);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      // Don't redirect on error - could be temporary network issue
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      localStorage.removeItem('user');
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // 🔧 FIX: Use consistent KYC restriction logic matching Dashboard.jsx
  // Include 'not_submitted' status and ensure consistent behavior across components
  const hasKycRestrictions = !user ? true : (
    user.kyc_status === 'rejected' || 
    user.kyc_status === 'pending' || 
    user.kyc_status === 'not_submitted' || 
    !user.kyc_status
  );
  const isKycRejected = user?.kyc_status === 'rejected';
  
  // 🔍 DEBUG: Add logging to match Dashboard.jsx debugging
  console.log('🔍 Layout KYC Check:', {
    kycStatus: user?.kyc_status,
    userLoaded: !!user,
    hasKycRestrictions,
    isKycRejected,
    currentPath: location.pathname
  });
  
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'withdraw', label: 'Withdraw', icon: CreditCard, path: '/dashboard', tab: 'withdraw', restricted: hasKycRestrictions },
    { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight, path: '/dashboard', tab: 'transfer', restricted: hasKycRestrictions },
    { id: 'transactions', label: 'Transactions', icon: History, path: '/dashboard', tab: 'transactions', restricted: hasKycRestrictions },
    { id: 'support', label: 'Support Ticket', icon: MessageSquare, path: '/support' },
    { id: 'settings', label: 'Setting', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        {/* Logo */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <img 
                src="/unseaflogo.PNG"
              alt="UNSEAF Logo" 
              className="h-10 w-10"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">UNSEAF</h1>
              <p className="text-xs text-gray-500">sustainability. innovation. acceleration.</p>
            </div>
          </div>
        </div>

        {/* User Info - Only show on dashboard pages */}
        {location.pathname === '/dashboard' && (
          <div className="p-4 border-b bg-blue-50">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <span className="text-blue-600 font-bold text-sm">
                  {user?.first_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User'}</p>
                <p className="text-xs text-gray-600">Balance: ${user?.balance?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="mt-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                            (item.path === '/dashboard' && location.pathname === '/dashboard');
            const isRestricted = item.restricted;
            
            // 🔧 FIX: Show ALL items but disable restricted ones (consistent with Dashboard.jsx)
            // This prevents financial pages from disappearing completely
            return (
              <Link
                key={item.id}
                to={isRestricted ? '#' : (item.tab ? `${item.path}?tab=${item.tab}` : item.path)}
                onClick={(e) => {
                  if (isRestricted) {
                    e.preventDefault();
                    return;
                  }
                }}
                className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors ${
                  isRestricted 
                    ? 'opacity-50 cursor-not-allowed text-gray-400' 
                    : isActive 
                      ? 'bg-blue-50 border-r-4 border-blue-600 text-blue-600 hover:bg-blue-50' 
                      : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
                {isRestricted && <Lock className="h-4 w-4 ml-auto" />}
              </Link>
            );
          })}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-6 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700 mt-4 border-t"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Log Out</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default Layout;