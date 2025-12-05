import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Mail, Download, Save } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { formatCurrency } from '../../utils/quarterlyUtils';
import ReceiptModal from '../receipts/ReceiptModal';

const AdminWithdrawalDetailModal = ({ isOpen, onClose, withdrawal, onUpdate }) => {
  const [newStatus, setNewStatus] = useState(withdrawal.status);
  const [processingMessage, setProcessingMessage] = useState(withdrawal.processing_message || '');
  const [updating, setUpdating] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      const updates = {
        status: newStatus,
        processing_message: processingMessage,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'completed' && withdrawal.status !== 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('withdrawals')
        .update(updates)
        .eq('id', withdrawal.id);

      if (error) throw error;

      // TODO: Send email notification to user
      
      onUpdate();
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      alert('Failed to update withdrawal status');
    } finally {
      setUpdating(false);
    }
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

  const renderMethodDetails = () => {
    const details = withdrawal.method_details || {};
    
    if (withdrawal.method === 'bank_transfer' || withdrawal.method === 'wire_transfer') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-sm text-gray-600">Account Holder:</span>
            <span className="text-sm font-medium">{details.accountHolderName}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-sm text-gray-600">Bank Name:</span>
            <span className="text-sm font-medium">{details.bankName}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-sm text-gray-600">Account Number:</span>
            <span className="text-sm font-medium">****{details.accountNumber?.slice(-4)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-sm text-gray-600">Routing Number:</span>
            <span className="text-sm font-medium">{details.routingNumber}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-sm text-gray-600">Account Type:</span>
            <span className="text-sm font-medium capitalize">{details.accountType}</span>
          </div>
          {withdrawal.method === 'wire_transfer' && details.swiftCode && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-gray-600">SWIFT Code:</span>
                <span className="text-sm font-medium">{details.swiftCode}</span>
              </div>
              {details.beneficiaryPhone && (
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm text-gray-600">Phone:</span>
                  <span className="text-sm font-medium">{details.beneficiaryPhone}</span>
                </div>
              )}
            </>
          )}
          <div className="grid grid-cols-2 gap-2">
            <span className="text-sm text-gray-600">Bank Address:</span>
            <span className="text-sm font-medium">{details.bankAddress}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-sm text-gray-600">Beneficiary Address:</span>
            <span className="text-sm font-medium">{details.beneficiaryAddress}</span>
          </div>
        </div>
      );
    } else if (withdrawal.method === 'digital_wallet') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-sm text-gray-600">Provider:</span>
            <span className="text-sm font-medium capitalize">{details.walletProvider}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-sm text-gray-600">Email/Phone:</span>
            <span className="text-sm font-medium">{details.walletEmail}</span>
          </div>
          {details.walletId && (
            <div className="grid grid-cols-2 gap-2">
              <span className="text-sm text-gray-600">Wallet ID:</span>
              <span className="text-sm font-medium">{details.walletId}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <span className="text-sm text-gray-600">Verification:</span>
            <span className="text-sm font-medium capitalize">{details.verificationStatus}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-sm text-gray-600">Currency:</span>
            <span className="text-sm font-medium">{details.currency}</span>
          </div>
        </div>
      );
    } else if (withdrawal.method === 'check') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-sm text-gray-600">Payee Name:</span>
            <span className="text-sm font-medium">{details.payeeName}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-sm text-gray-600">Address:</span>
            <span className="text-sm font-medium">
              {details.addressLine1}
              {details.addressLine2 && `, ${details.addressLine2}`}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-sm text-gray-600">City, State ZIP:</span>
            <span className="text-sm font-medium">
              {details.city}, {details.state} {details.zipCode}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-sm text-gray-600">Country:</span>
            <span className="text-sm font-medium">{details.country}</span>
          </div>
          {details.deliveryInstructions && (
            <div className="grid grid-cols-2 gap-2">
              <span className="text-sm text-gray-600">Instructions:</span>
              <span className="text-sm font-medium">{details.deliveryInstructions}</span>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Withdrawal Details</span>
              {getStatusBadge(withdrawal.status)}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="method">Method Details</TabsTrigger>
              <TabsTrigger value="receipt">Receipt</TabsTrigger>
              <TabsTrigger value="manage">Manage</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto mt-4">
              <TabsContent value="overview" className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
                  <h3 className="font-semibold mb-3">Transaction Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Transaction Number</p>
                      <p className="font-medium">{withdrawal.transaction_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-medium">
                        {new Date(withdrawal.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(withdrawal.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Net Amount</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(withdrawal.net_amount)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">User Information</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="text-sm font-medium">{withdrawal.user_name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium">{withdrawal.user_email}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm text-gray-600">Grant:</span>
                      <span className="text-sm font-medium">{withdrawal.grant_title}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm text-gray-600">Current Balance:</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(withdrawal.current_balance)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Quarterly Information</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm text-gray-600">Quarter:</span>
                      <span className="text-sm font-medium">{withdrawal.quarter_period}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm text-gray-600">Method:</span>
                      <span className="text-sm font-medium">{getMethodDisplay(withdrawal.method)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm text-gray-600">Fee:</span>
                      <span className="text-sm font-medium">{formatCurrency(withdrawal.fee)}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="method" className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-4">
                    {getMethodDisplay(withdrawal.method)} Details
                  </h3>
                  {renderMethodDetails()}
                </div>
              </TabsContent>

              <TabsContent value="receipt" className="space-y-4">
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Transaction Receipt</h3>
                  <p className="text-gray-600 mb-6">
                    View or download the official transaction receipt
                  </p>
                  <Button
                    onClick={() => setReceiptModalOpen(true)}
                    className="banking-button"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Receipt
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="manage" className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
                  <h3 className="font-semibold mb-2">View-Only Mode</h3>
                  <p className="text-sm text-gray-700">
                    This is a view-only interface. Withdrawal requests are automatically processed. 
                    No approval or status changes are required from admin.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Current Status
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {getStatusBadge(withdrawal.status)}
                    </div>
                  </div>

                  {withdrawal.processing_message && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Processing Notes
                      </label>
                      <div className="p-3 bg-gray-50 rounded-md text-sm">
                        {withdrawal.processing_message}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        window.location.href = `mailto:${withdrawal.user_email}?subject=Regarding Withdrawal ${withdrawal.transaction_number}`;
                      }}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Contact User via Email
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        withdrawalId={withdrawal.id}
      />
    </>
  );
};

export default AdminWithdrawalDetailModal;
