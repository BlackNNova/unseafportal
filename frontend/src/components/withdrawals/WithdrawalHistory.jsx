import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, FileText, Download, Plus } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { formatCurrency } from '../../utils/quarterlyUtils';
import ReceiptModal from '../receipts/ReceiptModal';
import '../../styles/banking.css';

const WithdrawalHistory = () => {
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  useEffect(() => {
    filterWithdrawals();
  }, [searchTerm, withdrawals]);

  const loadWithdrawals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
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
    if (!searchTerm) {
      setFilteredWithdrawals(withdrawals);
      return;
    }

    const filtered = withdrawals.filter(w => 
      w.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredWithdrawals(filtered);
  };

  const handleViewReceipt = (withdrawalId) => {
    setSelectedReceipt(withdrawalId);
    setReceiptModalOpen(true);
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
          <p className="text-gray-600">Loading withdrawal history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <Card className="banking-card">
          <CardHeader className="banking-card-header">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-2xl">Withdrawal History</CardTitle>
                <p className="text-blue-100 text-sm mt-1">
                  View and manage your withdrawal requests
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  onClick={() => navigate('/withdrawals/new')}
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Withdrawal
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="banking-card-body">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by transaction number, method, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Withdrawals List */}
            {filteredWithdrawals.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No matching withdrawals' : 'No withdrawals yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Start by creating your first withdrawal request'
                  }
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => navigate('/withdrawals/new')}
                    className="banking-button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Withdrawal
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWithdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {withdrawal.transaction_number}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(withdrawal.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {getStatusBadge(withdrawal.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Amount</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(withdrawal.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Fee</p>
                        <p className="text-sm text-gray-700">
                          {formatCurrency(withdrawal.fee)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Net Amount</p>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(withdrawal.net_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Method</p>
                        <p className="text-sm text-gray-700">
                          {getMethodDisplay(withdrawal.method)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Quarter: {withdrawal.quarter_period}
                      </div>
                      <Button
                        onClick={() => handleViewReceipt(withdrawal.id)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        View Receipt
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        withdrawalId={selectedReceipt}
      />
    </div>
  );
};

export default WithdrawalHistory;
