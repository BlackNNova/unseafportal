import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Search, Activity, Calendar, Filter, TrendingUp, TrendingDown, RefreshCcw, ShieldCheck, Database, ArrowUpCircle, ArrowDownCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/utils/supabase';

const TransactionsPage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'all',
    remark: 'any'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [kycStatus, setKycStatus] = useState(null);

  // Check KYC status (fallback validation)
  useEffect(() => {
    checkKYCStatus();
  }, []);

  // Load transactions on component mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  const checkKYCStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('kyc_status')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking KYC status:', error);
        return;
      }

      setKycStatus(profile.kyc_status);

      // Fallback: If KYC is not approved, redirect to dashboard
      if (profile.kyc_status !== 'approved') {
        console.log('🚫 Transactions Page: KYC not approved, redirecting to dashboard');
        alert('Your KYC verification must be approved to access transaction history.');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error checking KYC status:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to view transactions');
        return;
      }

      // Build query
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate + 'T00:00:00.000Z');
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate + 'T23:59:59.999Z');
      }
      if (filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }

      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        throw fetchError;
      }

      // Apply search filter on client side
      let filteredData = data || [];
      if (searchTerm) {
        filteredData = filteredData.filter(transaction => 
          transaction.transaction_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setTransactions(filteredData);
      console.log('Transactions status snapshot:', filteredData.map(t => ({ transaction_number: t.transaction_number, status: t.status })));
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchTransactions();
  };

  const handleSearch = () => {
    fetchTransactions();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatAmount = (amount, type) => {
    const formatted = parseFloat(amount || 0).toFixed(2);
    return type === 'credit' ? `+$${formatted}` : `-$${formatted}`;
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const getStatusBadge = (type) => {
    return type === 'credit' ? (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
        Credit
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
        Debit
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg p-6 mb-6 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-2 rounded-full shadow-sm">
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Transaction History</h1>
              <p className="text-blue-100">View and analyze all your financial activities</p>
            </div>
          </div>
          <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
            <Database className="h-5 w-5 text-white mr-2" />
            <span className="text-white text-sm font-medium">Complete Records</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-blue-100 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
          <CardTitle className="flex items-center text-blue-800">
            <Filter className="h-5 w-5 mr-2" />
            Search & Filter Options
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Date Range */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-blue-700 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  className="text-sm border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Start Date"
                />
                <span className="text-blue-500 font-medium">to</span>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  className="text-sm border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="End Date"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-blue-700 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Transaction Type
              </label>
              <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                <SelectTrigger className="border-blue-200 bg-white focus:ring-blue-500 h-10">
                  <SelectValue placeholder="All Transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 mr-2 text-blue-600" />
                      <span>All Transactions</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="credit">
                    <div className="flex items-center">
                      <ArrowUpCircle className="h-4 w-4 mr-2 text-green-600" />
                      <span>Credit</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="debit">
                    <div className="flex items-center">
                      <ArrowDownCircle className="h-4 w-4 mr-2 text-red-600" />
                      <span>Debit</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Remark Filter */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-blue-700 flex items-center">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Category
              </label>
              <Select value={filters.remark} onValueChange={(value) => setFilters({...filters, remark: value})}>
                <SelectTrigger className="border-blue-200 bg-white focus:ring-blue-500 h-10">
                  <SelectValue placeholder="Any Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">
                    <span>Any Category</span>
                  </SelectItem>
                  <SelectItem value="grant">
                    <span>Grant</span>
                  </SelectItem>
                  <SelectItem value="fee">
                    <span>Fee</span>
                  </SelectItem>
                  <SelectItem value="transfer">
                    <span>Transfer</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Apply Filter Button */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-blue-700 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </label>
              <Button 
                onClick={handleApplyFilters}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 font-medium shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    Apply Filters
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-4">
              <div className="text-sm font-semibold text-blue-700 whitespace-nowrap">
                Quick Search:
              </div>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                <Input
                  placeholder="Search transactions, references, descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-blue-200 bg-white focus:border-blue-500 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button 
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="border border-blue-100 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" />
              <span className="text-blue-800">Transaction History</span>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          )}

          <div className="overflow-x-auto bg-white rounded-lg border border-blue-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <th className="text-left py-4 px-4 font-semibold">TRX NO.</th>
                  <th className="text-left py-4 px-4 font-semibold">TIME</th>
                  <th className="text-right py-4 px-4 font-semibold">AMOUNT</th>
                  <th className="text-right py-4 px-4 font-semibold">POST BALANCE</th>
                  <th className="text-left py-4 px-4 font-semibold">DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((transaction, index) => (
                    <tr key={transaction.id || index} className="border-b hover:bg-blue-50 transition-colors duration-150">
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-sm font-bold text-blue-600">
                            {transaction.transaction_number || `TRX${String(index + 1).padStart(6, '0')}`}
                          </span>
                          <div className="mt-2">
                            {getStatusBadge(transaction.type)}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center mb-1">
                            <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(transaction.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 text-gray-400 mr-2" />
                            <span className="text-xs text-gray-500">
                              {formatTime(transaction.created_at)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`font-bold text-lg ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatAmount(transaction.amount, transaction.type)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-blue-700">
                          {formatCurrency(transaction.post_balance)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-gray-900">
                            {transaction.description || 'Transaction'}
                          </span>
                          {transaction.reference && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Ref: {transaction.reference}
                            </span>
                          )}
                          <div className="flex items-center mt-1">
                            <ShieldCheck className="h-3 w-3 text-green-500 mr-1" />
                            <span className="text-xs text-green-600 font-medium">
                              {transaction.status}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-20 text-center">
                      <div className="flex flex-col items-center">
                        {loading ? (
                          <>
                            <RefreshCcw className="h-12 w-12 text-blue-400 animate-spin mb-4" />
                            <h3 className="text-xl font-medium text-blue-800 mb-2">Loading transactions...</h3>
                            <p className="text-blue-600">
                              Please wait while we fetch your transaction history.
                            </p>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-12 w-12 text-blue-300 mb-4" />
                            <h3 className="text-xl font-medium text-blue-800 mb-2">No transactions found</h3>
                            <p className="text-blue-600">
                              No transactions match your current search and filter criteria.
                            </p>
                          </>
                        )}
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
};

export default TransactionsPage;
