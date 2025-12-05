import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LayoutDashboard, 
  CreditCard, 
  ArrowLeftRight, 
  History, 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  FileText,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import KYCForm from './KYCForm';
import FeatureFlagWrapper from './FeatureFlagWrapper';
import WithdrawPage from './withdrawals/WithdrawalPage';
import TransactionsPage from './TransactionsPage';
import { supabase, auth } from '@/utils/supabase';
import { formatCurrency, formatBalance, formatTransactionAmount } from '../utils/currencyFormatter';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [kycStatus, setKycStatus] = useState(null);
  const [previousKycStatus, setPreviousKycStatus] = useState(null);
  const [kycNotification, setKycNotification] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Reset activeTab when navigating to dashboard route
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  // Reset activeTab to dashboard when component first loads
  useEffect(() => {
    setActiveTab('dashboard');
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchUserData(),
          fetchDashboardData(),
          fetchKYCStatus()
        ]);
      } catch (err) {
        console.error('Dashboard loading error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    
    // Poll for KYC status updates every 30 seconds if KYC is pending
    const interval = setInterval(() => {
      if (kycStatus?.kyc_status === 'pending') {
        fetchKYCStatus();
      }
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, [kycStatus?.kyc_status, location.pathname]); // Refetch when returning to dashboard

  const fetchUserData = async () => {
    try {
      console.log('Fetching user data...');
      const userData = await auth.getCurrentUser();
      
      if (userData) {
        console.log('User data received:', userData);
        setUser(userData);
      } else {
        console.log('No user data found, but ProtectedRoute will handle auth');
        // Don't redirect here - ProtectedRoute handles authentication
        // This prevents unnecessary logouts during temporary network issues
      }
    } catch (err) {
      console.error('User data fetch error:', err);
      // Don't redirect on error - could be temporary network issue
      // ProtectedRoute will handle actual auth failures
      setError('Temporary issue loading user data. Please refresh if problem persists.');
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Get current user to use their ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Fetch dashboard stats from various tables
      const { data: withdrawals, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('amount, net_amount')
        .eq('user_id', user.id)
        .eq('status', 'pending');
        
      if (withdrawalError) throw withdrawalError;
      
      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date().toISOString().split('T')[0]);
        
      if (transactionError) throw transactionError;
      
      // Fetch all credits (including admin-initiated credits)
      const { data: credits, error: creditsError } = await supabase
        .from('transactions')
        .select('transaction_id, transaction_number, amount, created_at, description, reference')
        .eq('user_id', user.id)
        .eq('type', 'credit')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (creditsError) {
        console.error('Credits query error:', creditsError);
      }
      
      // Fetch recent debits (withdrawals/transfers)
      const { data: debits, error: debitsError } = await supabase
        .from('transactions')
        .select('transaction_id, transaction_number, amount, created_at, description, reference')
        .eq('user_id', user.id)
        .eq('type', 'debit')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (debitsError) {
        console.error('Debits query error:', debitsError);
      }
      
      // Fetch past transactions (all types combined)
      const { data: pastTransactions, error: pastTransactionsError } = await supabase
        .from('transactions')
        .select('transaction_id, transaction_number, type, amount, status, created_at, description, reference')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (pastTransactionsError) {
        console.error('Past transactions query error:', pastTransactionsError);
      }
      
                      console.log('Dashboard data fetched:', {
        credits: credits?.length || 0,
        debits: debits?.length || 0,
        pastTransactions: pastTransactions?.length || 0,
        user_id: user.id
      });
      console.log('Past tx status snapshot:', (pastTransactions || []).map(t => ({ transaction_number: t.transaction_number, status: t.status })));
      console.log('Latest credit ids:', (credits || []).map(t => ({ transaction_number: t.transaction_number, status: t.status })));
      console.log('Latest debit ids:', (debits || []).map(t => ({ transaction_number: t.transaction_number, status: t.status })));
      
      // Calculate totals (use NET amount, not gross)
      const pendingWithdrawals = withdrawals?.reduce((sum, w) => sum + parseFloat(w.net_amount || w.amount || 0), 0) || 0;
      const todayTransactions = transactions?.length || 0;
      
      const data = {
        action_required: true, // Always show KYC section
        pending_withdrawals: pendingWithdrawals,
        today_transactions: todayTransactions,
        latest_credits: credits || [],
        latest_debits: debits || [],
        past_transactions: pastTransactions || []
      };
      
      setDashboardData(data);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      // Set empty data instead of throwing to prevent infinite redirect
      setDashboardData({
        action_required: true,
        pending_withdrawals: 0,
        today_transactions: 0,
        latest_credits: [],
        latest_debits: [],
        past_transactions: []
      });
    }
  };

  const fetchKYCStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('kyc_status')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Failed to fetch KYC status:', error);
        return;
      }
      
      const kycData = {
        kyc_status: data.kyc_status || 'not_submitted'
      };
      
      // Check if status has changed
      if (previousKycStatus && previousKycStatus !== kycData.kyc_status) {
        // Status has changed, show notification
        if (kycData.kyc_status === 'approved') {
          setKycNotification({
            type: 'success',
            message: 'Great news! Your KYC verification has been approved.'
          });
          // Clear notification after 5 seconds
          setTimeout(() => setKycNotification(null), 5000);
        } else if (kycData.kyc_status === 'rejected') {
          setKycNotification({
            type: 'error',
            message: 'Your KYC verification was rejected. Please review and resubmit your documents.'
          });
          // Clear notification after 7 seconds
          setTimeout(() => setKycNotification(null), 7000);
        }
      }
      
      setPreviousKycStatus(kycData.kyc_status);
      setKycStatus(kycData);
    } catch (err) {
      console.error('Failed to fetch KYC status:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };


  // Check if user has KYC restrictions
  // CRITICAL: Default to TRUE (restricted) if kycStatus not loaded yet to prevent flash of unrestricted items
  const hasKycRestrictions = !kycStatus ? true : (kycStatus.kyc_status === 'rejected' || kycStatus.kyc_status === 'pending' || kycStatus.kyc_status === 'not_submitted' || !kycStatus.kyc_status);
  const isKycRejected = kycStatus?.kyc_status === 'rejected';
  
  // Debug logging
  console.log('🔍 Dashboard KYC Check:', {
    kycStatus: kycStatus?.kyc_status,
    kycStatusLoaded: !!kycStatus,
    hasKycRestrictions,
    isKycRejected
  });
  
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'withdraw', label: 'Withdraw', icon: CreditCard, restricted: hasKycRestrictions },
    { id: 'transfer', label: 'Project Payments', icon: ArrowLeftRight, restricted: hasKycRestrictions },
    { id: 'transactions', label: 'Transactions', icon: History, restricted: hasKycRestrictions },
    { id: 'support', label: 'Support Ticket', icon: MessageSquare, path: '/support' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'kyc':
        return <KYCForm />;
      case 'transfer':
        // Don't render if KYC restricted
        if (hasKycRestrictions) {
          return (
            <div className="text-center py-12">
              <p className="text-gray-600">KYC verification required to access this feature.</p>
            </div>
          );
        }
        return <FeatureFlagWrapper />;
      case 'withdraw':
        // Don't render if KYC restricted
        if (hasKycRestrictions) {
          return (
            <div className="text-center py-12">
              <p className="text-gray-600">KYC verification required to access this feature.</p>
            </div>
          );
        }
        return <WithdrawPage />;
      case 'transactions':
        // Don't render if KYC restricted
        if (hasKycRestrictions) {
          return (
            <div className="text-center py-12">
              <p className="text-gray-600">KYC verification required to access this feature.</p>
            </div>
          );
        }
        return <TransactionsPage />;
      default:
        return (
          <div>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.first_name || 'User'}!</p>
            </div>

            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* KYC Rejection Alert */}
            {isKycRejected && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div>
                    <div className="font-semibold mb-2">KYC Verification Rejected</div>
                    <p className="mb-2">Your KYC documents have been rejected. You cannot access withdraw, transfer, or transaction features until your KYC is approved.</p>
                    <Button 
                      onClick={() => setActiveTab('kyc')}
                      variant="outline" 
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      Resubmit KYC Documents
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* KYC Status Change Notification */}
            {kycNotification && (
              <Alert className={`mb-6 ${
                kycNotification.type === 'success' 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-orange-200 bg-orange-50'
              }`}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className={
                  kycNotification.type === 'success' 
                    ? 'text-green-800' 
                    : 'text-orange-800'
                }>
                  {kycNotification.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Required */}
            {dashboardData?.action_required && (
              <Card className="mb-6 border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-900">Action required</h3>
                      <p className="text-blue-700 mt-1">
                        {kycStatus?.kyc_status === 'approved' 
                          ? 'Your KYC verification is complete'
                          : kycStatus?.kyc_status === 'pending'
                          ? 'Your KYC documents are under review'
                          : kycStatus?.kyc_status === 'rejected'
                          ? 'Your KYC documents were rejected. Please resubmit.'
                          : 'Complete your KYC verification to access all features'
                        }
                      </p>
                      {kycStatus?.kyc_status === 'pending' && (
                        <p className="text-xs text-blue-600 mt-2">
                          Status automatically refreshes every 30 seconds
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {kycStatus?.kyc_status === 'pending' && (
                        <Button
                          onClick={fetchKYCStatus}
                          variant="outline"
                          size="sm"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Check Status
                        </Button>
                      )}
                      <Button 
                        onClick={() => setActiveTab('kyc')}
                        disabled={kycStatus?.kyc_status === 'approved' || kycStatus?.kyc_status === 'pending'}
                        className={`${
                          kycStatus?.kyc_status === 'approved' || kycStatus?.kyc_status === 'pending'
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : kycStatus?.kyc_status === 'rejected'
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        } text-white`}
                      >
                        {kycStatus?.kyc_status === 'approved'
                          ? 'Verification Complete'
                          : kycStatus?.kyc_status === 'pending'
                          ? 'Documents Submitted'
                          : kycStatus?.kyc_status === 'rejected'
                          ? 'Resubmit Documents'
                          : 'Click Here to Submit Documents'
                        }
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid lg:grid-cols-1 gap-6 mb-8">
              {/* User Info Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-blue-600 mb-2">
                      {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.grant_number?.toUpperCase() || 'USER'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Grant #{user?.grant_number || user?.account_number}
                    </p>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">Available Balance</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatBalance(user?.balance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Pending Withdrawals</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(dashboardData?.pending_withdrawals)}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <TrendingDown className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Today Transactions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardData?.today_transactions || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction Tables */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Latest Credits */}
              <Card>
                <CardHeader>
                  <CardTitle>Latest Credits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 text-sm font-medium text-gray-600">TRX NO.</th>
                          <th className="text-left py-2 text-sm font-medium text-gray-600">DATE</th>
                          <th className="text-right py-2 text-sm font-medium text-gray-600">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData?.latest_credits?.length > 0 ? (
                          dashboardData.latest_credits.map((transaction, index) => (
                            <tr key={transaction.transaction_id || index} className="border-b">
                              <td className="py-2 text-sm text-gray-900">{transaction.transaction_number || transaction.transaction_id}</td>
                              <td className="py-2 text-sm text-gray-600">
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-2 text-sm text-green-600 text-right font-medium">
                                {formatTransactionAmount(transaction.amount, 'credit')}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="py-8 text-center text-gray-500">
                              Data not found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Latest Debits */}
              <Card>
                <CardHeader>
                  <CardTitle>Latest Debits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 text-sm font-medium text-gray-600">TRX NO.</th>
                          <th className="text-left py-2 text-sm font-medium text-gray-600">DATE</th>
                          <th className="text-right py-2 text-sm font-medium text-gray-600">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData?.latest_debits?.length > 0 ? (
                          dashboardData.latest_debits.map((transaction, index) => (
                            <tr key={transaction.transaction_id || index} className="border-b">
                              <td className="py-2 text-sm text-gray-900">{transaction.transaction_number || transaction.transaction_id}</td>
                              <td className="py-2 text-sm text-gray-600">
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-2 text-sm text-red-600 text-right font-medium">
                                {formatTransactionAmount(transaction.amount, 'debit')}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="py-8 text-center text-gray-500">
                              Data not found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Past Transactions Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Past Transactions</CardTitle>
                  <CardDescription className="mt-1">Your recent transaction history</CardDescription>
                </div>
                {!hasKycRestrictions && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('transactions')}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <History className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Transaction ID</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Description</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.past_transactions?.length > 0 ? (
                        dashboardData.past_transactions.map((transaction, index) => (
                          <tr key={transaction.transaction_id || index} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900 font-mono">
                              {transaction.transaction_number || transaction.transaction_id || '-'}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {transaction.type === 'credit' ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Credit
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                  Debit
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                              {transaction.description || transaction.reference || '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {new Date(transaction.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </td>
                            <td className={`py-3 px-4 text-sm text-right font-medium ${
                              transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatTransactionAmount(transaction.amount, transaction.type)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge 
                                className={`${
                                  transaction.status === 'completed' || transaction.status === 'approved'
                                    ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                    : transaction.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                                    : transaction.status === 'processing'
                                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                                }`}
>
                                {transaction.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <History className="h-12 w-12 mb-3 text-gray-400" />
                              <p className="text-lg font-medium">No transactions yet</p>
                              <p className="text-sm mt-1">Your transaction history will appear here</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

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

          {/* Navigation */}
          <nav className="mt-6">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path ? location.pathname === item.path : activeTab === item.id;
              const isRestricted = item.restricted;
              
              // Show all items, but disable restricted ones
              if (item.path) {
                // Use Link for pages with dedicated routes
                return (
                  <Link
                    key={item.id}
                    to={isRestricted ? '#' : item.path}
                    onClick={(e) => {
                      if (isRestricted) {
                        e.preventDefault();
                        return;
                      }
                      // Reset to dashboard tab when clicking dashboard link
                      if (item.id === 'dashboard') {
                        setActiveTab('dashboard');
                      }
                    }}
                    className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors ${
                      isRestricted 
                        ? 'opacity-50 cursor-not-allowed text-gray-400' 
                        : isActive 
                          ? 'bg-blue-50 border-r-4 border-blue-600 text-blue-600 hover:bg-gray-50' 
                          : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                    {isRestricted && <Lock className="h-4 w-4 ml-auto" />}
                  </Link>
                );
              } else {
                // Use button for local tabs
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isRestricted) return;
                      setActiveTab(item.id);
                    }}
                    disabled={isRestricted}
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
                  </button>
                );
              }
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
      <div className="flex-1 p-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;

