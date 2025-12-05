import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, FileText, Eye, Download } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { formatCurrency } from '../../utils/quarterlyUtils';
import AdminWithdrawalDetailModal from './AdminWithdrawalDetailModal';
import '../../styles/banking.css';

const AdminWithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    completedToday: 0,
    totalAmount: 0
  });

  useEffect(() => {
    loadWithdrawals();
  }, []);

  useEffect(() => {
    filterWithdrawals();
    calculateStats();
  }, [searchTerm, statusFilter, methodFilter, withdrawals]);

  const loadWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_withdrawals_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWithdrawals(data || []);
      setFilteredWithdrawals(data || []);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterWithdrawals = () => {
    let filtered = [...withdrawals];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(w =>
        w.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(w => w.status === statusFilter);
    }

    // Method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter(w => w.method === methodFilter);
    }

    setFilteredWithdrawals(filtered);
  };

  const calculateStats = () => {
    const pending = withdrawals.filter(w => w.status === 'pending').length;
    const processing = withdrawals.filter(w => w.status === 'processing').length;
    
    const today = new Date().toDateString();
    const completedToday = withdrawals.filter(w => 
      w.status === 'completed' && 
      new Date(w.completed_at).toDateString() === today
    ).length;

    const totalAmount = withdrawals
      .filter(w => w.status === 'pending' || w.status === 'processing')
      .reduce((sum, w) => sum + parseFloat(w.amount), 0);

    setStats({ pending, processing, completedToday, totalAmount });
  };

  const handleViewDetails = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setDetailModalOpen(true);
  };

  const handleWithdrawalUpdated = () => {
    loadWithdrawals();
    setDetailModalOpen(false);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'bg-yellow-500',
      processing: 'bg-blue-600',
      completed: 'bg-green-600',
      failed: 'bg-red-600'
    };

    return (
      <Badge className={`${variants[status]} text-white`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getMethodDisplay = (method) => {
    const names = {
      bank_transfer: 'Bank Transfer',
      wire_transfer: 'Wire Transfer',
      digital_wallet: 'Digital Wallet',
      check: 'Physical Check'
    };
    return names[method] || method;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading withdrawals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Processing</p>
                <p className="text-3xl font-bold text-blue-600">{stats.processing}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Completed Today</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedToday}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Card */}
        <Card className="banking-card">
          <CardHeader className="banking-card-header">
            <CardTitle className="text-white text-2xl">Withdrawal Management</CardTitle>
            <p className="text-blue-100 text-sm mt-1">
              Manage and process all withdrawal requests
            </p>
          </CardHeader>

          <CardContent className="banking-card-body">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by transaction, user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                  <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
                  <SelectItem value="check">Physical Check</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Withdrawals Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWithdrawals.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        No withdrawals found
                      </td>
                    </tr>
                  ) : (
                    filteredWithdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {withdrawal.transaction_number}
                          </div>
                          <div className="text-xs text-gray-500">
                            {withdrawal.quarter_period}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{withdrawal.user_name}</div>
                          <div className="text-xs text-gray-500">{withdrawal.user_email}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(withdrawal.amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Net: {formatCurrency(withdrawal.net_amount)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getMethodDisplay(withdrawal.method)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getStatusBadge(withdrawal.status)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(withdrawal.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <Button
                            onClick={() => handleViewDetails(withdrawal)}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      {selectedWithdrawal && (
        <AdminWithdrawalDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          withdrawal={selectedWithdrawal}
          onUpdate={handleWithdrawalUpdated}
        />
      )}
    </div>
  );
};

export default AdminWithdrawalsPage;
