import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, X } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { generateWithdrawalReceipt } from '../../utils/receiptGenerator';

const ReceiptModal = ({ isOpen, onClose, withdrawalId }) => {
  const [receiptHTML, setReceiptHTML] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && withdrawalId) {
      loadReceipt();
    }
  }, [isOpen, withdrawalId]);

  const loadReceipt = async () => {
    setLoading(true);
    try {
      // Get withdrawal data
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (withdrawalError) throw withdrawalError;

      // Get user data
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // Get grant data
      const { data: grantData, error: grantError } = await supabase
        .from('user_grants')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (grantError) throw grantError;

      // Check if receipt already exists
      if (withdrawal.receipt_html) {
        setReceiptHTML(withdrawal.receipt_html);
      } else {
        // Generate new receipt
        const html = generateWithdrawalReceipt(withdrawal, userData, grantData);
        setReceiptHTML(html);

        // Save receipt to database
        await supabase
          .from('withdrawals')
          .update({
            receipt_html: html,
            receipt_generated_at: new Date().toISOString()
          })
          .eq('id', withdrawalId);
      }
    } catch (error) {
      console.error('Error loading receipt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownload = () => {
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${withdrawalId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Transaction Receipt</span>
            <div className="flex gap-2">
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-lg bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading receipt...</p>
              </div>
            </div>
          ) : (
            <iframe
              srcDoc={receiptHTML}
              title="Receipt"
              className="w-full h-full min-h-[600px]"
              style={{ border: 'none' }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptModal;
