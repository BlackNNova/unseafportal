import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, AlertCircle, Send, ArrowLeft, BanknoteIcon, Building, CircleDollarSign, RefreshCcw, ShieldCheck, History, AlertTriangle } from 'lucide-react';
import { supabase } from '@/utils/supabase';

const TransferPage = () => {
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState([]);
  const [filteredTransfers, setFilteredTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trxSearch, setTrxSearch] = useState('');
  const [dateSearch, setDateSearch] = useState('');
  const [activeTab, setActiveTab] = useState('send_money');
  const [kycStatus, setKycStatus] = useState(null);
  
  // Send Money form state
  const [sendForm, setSendForm] = useState({
    recipient_name: '',
    recipient_account: '',
    recipient_bank: '',
    amount: '',
    description: '',
    transfer_type: 'within_unseaf'
  });
  const [sendLoading, setSendLoading] = useState(false);

  // Check KYC status (fallback validation)
  useEffect(() => {
    checkKYCStatus();
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const checkKYCStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Don't redirect - ProtectedRoute handles authentication
        console.warn('No user found in TransferPage KYC check');
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
        console.log('🚫 Transfer Page: KYC not approved, redirecting to dashboard');
        alert('Your KYC verification must be approved to access transfers.');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error checking KYC status:', error);
    }
  };

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to view transfers');
        return;
      }

      // Fetch transfers from Supabase
      let query = supabase
        .from('transfers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        throw fetchError;
      }

      setTransfers(data || []);
      setFilteredTransfers(data || []);
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setError('Failed to load transfers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    let results = transfers;

    if (trxSearch) {
      results = results.filter(t => 
        t.transaction_number?.toLowerCase().includes(trxSearch.toLowerCase())
      );
    }

    if (dateSearch) {
      results = results.filter(t => {
        const transferDate = new Date(t.created_at).toISOString().split('T')[0];
        return transferDate === dateSearch;
      });
    }
    
    setFilteredTransfers(results);
  };

  const handleSendMoney = async (e) => {
    e.preventDefault();
    
    if (!sendForm.recipient_name || !sendForm.amount || !sendForm.recipient_account) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSendLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to send money');
        return;
      }

      // Generate transaction number
      const transactionNumber = `TRF${Date.now()}`;
      const amount = parseFloat(sendForm.amount);
      const charge = amount * 0.01; // 1% charge
      const totalAmount = amount + charge;

      // Insert transfer record
      const { error: insertError } = await supabase
        .from('transfers')
        .insert({
          user_id: user.id,
          transaction_number: transactionNumber,
          recipient_name: sendForm.recipient_name,
          recipient_account: sendForm.recipient_account,
          recipient_bank: sendForm.recipient_bank,
          amount: amount,
          charge: charge,
          paid_amount: totalAmount,
          description: sendForm.description,
          transfer_type: sendForm.transfer_type,
          status: 'pending'
        });

      if (insertError) {
        throw insertError;
      }

      alert(`Transfer initiated successfully!\nTransaction Number: ${transactionNumber}\nAmount: $${amount.toFixed(2)}\nCharge: $${charge.toFixed(2)}\nTotal: $${totalAmount.toFixed(2)}`);
      
      // Reset form
      setSendForm({
        recipient_name: '',
        recipient_account: '',
        recipient_bank: '',
        amount: '',
        description: '',
        transfer_type: 'within_unseaf'
      });
      
      // Refresh transfers list
      fetchTransfers();
      
      // Switch to transfer history tab
      setActiveTab('transfer_history');
      
    } catch (err) {
      console.error('Error sending money:', err);
      alert('Failed to send money. Please try again.');
    } finally {
      setSendLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Processing</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-US')} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg p-6 mb-6 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-2 rounded-full shadow-sm">
              <BanknoteIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Money Transfer</h1>
              <p className="text-blue-100">Send money securely to other accounts</p>
            </div>
          </div>
          <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
            <ShieldCheck className="h-5 w-5 text-white mr-2" />
            <span className="text-white text-sm font-medium">Secure Transactions</span>
          </div>
        </div>
      </div>
      
      <Card className="border border-blue-100 shadow-sm rounded-xl overflow-hidden">  
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start rounded-none bg-gradient-to-r from-blue-500 to-blue-600 p-3">
              <TabsTrigger value="send_money" className="text-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-white">
                <Send className="h-4 w-4 mr-2" />
                Send Money
              </TabsTrigger>
              <TabsTrigger value="transfer_history" className="text-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-white">
                <History className="h-4 w-4 mr-2" />
                Transfer History
              </TabsTrigger>
            </TabsList>

            {/* Send Money Tab */}
            <TabsContent value="send_money" className="p-6">
              <div className="max-w-2xl mx-auto">
                <div className="mb-8 bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-3">
                    <Send className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-xl font-semibold text-blue-800">Send Money</h2>
                  </div>
                  <p className="text-blue-700">Transfer funds to other accounts quickly and securely.</p>
                </div>

                <form onSubmit={handleSendMoney} className="space-y-6">
                  {/* Transfer Type */}
                  <div className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-200 mb-2">
                    <Label htmlFor="transfer_type" className="text-blue-700 font-semibold">Transfer Type *</Label>
                    <Select 
                      value={sendForm.transfer_type} 
                      onValueChange={(value) => setSendForm({...sendForm, transfer_type: value})}
                    >
                      <SelectTrigger className="border-blue-200 bg-white focus:ring-blue-500 h-11">
                        <SelectValue placeholder="Select transfer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="within_unseaf">
                          <div className="flex items-center">
                            <CircleDollarSign className="h-4 w-4 mr-2 text-blue-600" />
                            <span>Within UNSEAF</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="other_bank">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2 text-blue-600" />
                            <span>Other Bank</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="wire_transfer">
                          <div className="flex items-center">
                            <Send className="h-4 w-4 mr-2 text-blue-600" />
                            <span>Wire Transfer</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Recipient Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-blue-200 mb-2">
                    <div className="space-y-2">
                      <Label htmlFor="recipient_name" className="text-blue-700 font-semibold">Recipient Name *</Label>
                      <Input
                        id="recipient_name"
                        value={sendForm.recipient_name}
                        onChange={(e) => setSendForm({...sendForm, recipient_name: e.target.value})}
                        placeholder="Enter recipient's full name"
                        className="border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="recipient_account" className="text-blue-700 font-semibold">Account Number *</Label>
                      <Input
                        id="recipient_account"
                        value={sendForm.recipient_account}
                        onChange={(e) => setSendForm({...sendForm, recipient_account: e.target.value})}
                        placeholder="Enter account number"
                        className="border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mb-2 p-4 bg-white rounded-lg border border-blue-200">
                    <Label htmlFor="recipient_bank" className="text-blue-700 font-semibold">Bank Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-5 w-5" />
                      <Input
                        id="recipient_bank"
                        value={sendForm.recipient_bank}
                        onChange={(e) => setSendForm({...sendForm, recipient_bank: e.target.value})}
                        placeholder="Enter bank name (if applicable)"
                        className="pl-10 border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 mb-2">
                    <Label htmlFor="amount" className="text-blue-700 font-semibold flex items-center">
                      <CircleDollarSign className="h-5 w-5 mr-2 text-blue-600" />
                      Transfer Amount *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 text-lg font-semibold">$</span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={sendForm.amount}
                        onChange={(e) => setSendForm({...sendForm, amount: e.target.value})}
                        placeholder="0.00"
                        className="pl-8 border-blue-200 h-12 text-lg font-medium focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    {sendForm.amount && (
                      <div className="mt-3 bg-white p-3 rounded-md border border-blue-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">Transfer Amount:</span>
                          <span className="font-semibold text-blue-800">${parseFloat(sendForm.amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">Service Charge (1%):</span>
                          <span className="font-semibold text-red-600">${(parseFloat(sendForm.amount || 0) * 0.01).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center font-semibold border-t border-blue-200 pt-2 mt-2">
                          <span className="text-blue-900">Total Amount:</span>
                          <span className="text-lg text-blue-900">${(parseFloat(sendForm.amount || 0) * 1.01).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2 p-4 bg-white rounded-lg border border-blue-200 mb-2">
                    <Label htmlFor="description" className="text-blue-700 font-semibold">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={sendForm.description}
                      onChange={(e) => setSendForm({...sendForm, description: e.target.value})}
                      placeholder="Add a note for this transfer..."
                      rows={3}
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 mt-8">
                    <h3 className="text-white font-semibold mb-4 flex items-center">
                      <ShieldCheck className="h-5 w-5 mr-2" />
                      Ready to Complete Your Transfer
                    </h3>
                    <div className="flex space-x-4">
                      <Button 
                        type="submit" 
                        className="bg-white hover:bg-blue-50 text-blue-700 flex-1 h-12 font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
                        disabled={sendLoading}
                      >
                        {sendLoading ? (
                          <div className="flex items-center justify-center">
                            <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <Send className="h-4 w-4 mr-2" />
                            Send Money
                          </div>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setSendForm({
                          recipient_name: '',
                          recipient_account: '',
                          recipient_bank: '',
                          amount: '',
                          description: '',
                          transfer_type: 'within_unseaf'
                        })}
                        className="flex-1 h-12 border-white text-white hover:bg-blue-500 hover:text-white transition-all duration-200"
                      >
                        Reset Form
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </TabsContent>

            {/* Transfer History Tab */}
            <TabsContent value="transfer_history" className="p-6">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-blue-800 mb-2 flex items-center">
                    <History className="h-5 w-5 mr-2 text-blue-600" />
                    Transfer History
                  </h2>
                  <p className="text-blue-600">View and track all your money transfer transactions</p>
                </div>
                {filteredTransfers.length > 0 && (
                  <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                    {filteredTransfers.length} {filteredTransfers.length === 1 ? 'transfer' : 'transfers'}
                  </Badge>
                )}
              </div>
              
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-700 font-medium">{error}</span>
                </div>
              )}
              
              <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-4 mb-8 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="relative flex-1 w-full md:max-w-xs">
                  <div className="font-medium text-blue-700 mb-2 text-sm">Transaction Number</div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
                    <Input 
                      placeholder="TRX No." 
                      value={trxSearch} 
                      onChange={(e) => setTrxSearch(e.target.value)} 
                      className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="relative flex-1 w-full md:max-w-xs">
                  <div className="font-medium text-blue-700 mb-2 text-sm">Transaction Date</div>
                  <Input 
                    type="date" 
                    placeholder="Select date" 
                    value={dateSearch} 
                    onChange={(e) => setDateSearch(e.target.value)} 
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="self-end pt-6 w-full md:w-auto">
                  <Button 
                    onClick={handleSearch}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto h-10"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search Transfers
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto bg-white rounded-lg border border-blue-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                      <th className="py-3 px-4 text-left font-semibold">TRX NO.</th>
                      <th className="py-3 px-4 text-left font-semibold">TIME</th>
                      <th className="py-3 px-4 text-left font-semibold">RECIPIENT</th>
                      <th className="py-3 px-4 text-left font-semibold">ACCOUNT NO.</th>
                      <th className="py-3 px-4 text-left font-semibold">BANK</th>
                      <th className="py-3 px-4 text-right font-semibold">AMOUNT</th>
                      <th className="py-3 px-4 text-right font-semibold">CHARGE</th>
                      <th className="py-3 px-4 text-right font-semibold">PAID AMOUNT</th>
                      <th className="py-3 px-4 text-center font-semibold">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransfers.length > 0 ? (
                      filteredTransfers.map(t => (
                        <tr key={t.id} className="border-b hover:bg-blue-50 transition-colors duration-150">
                          <td className="py-3 px-4 font-mono text-sm font-bold text-blue-600">{t.transaction_number || `TRF${t.id}`}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{formatDate(t.created_at)}</td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{t.recipient_name || 'N/A'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{t.recipient_account || 'N/A'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{t.recipient_bank || 'N/A'}</td>
                          <td className="py-3 px-4 text-right font-medium text-gray-900">${parseFloat(t.amount || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-sm font-medium text-red-600">-${parseFloat(t.charge || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-bold text-blue-700">${parseFloat(t.paid_amount || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">{getStatusBadge(t.status || 'pending')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="py-20 text-center">
                          <div className="flex flex-col items-center">
                            {loading ? (
                              <>
                                <RefreshCcw className="h-12 w-12 text-blue-400 animate-spin mb-4" />
                                <h3 className="text-xl font-medium text-blue-800 mb-2">Loading transfers...</h3>
                                <p className="text-blue-600">
                                  Please wait while we fetch your transfer history.
                                </p>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-12 w-12 text-blue-300 mb-4" />
                                <h3 className="text-xl font-medium text-blue-800 mb-2">No transfers found</h3>
                                <p className="text-blue-600">
                                  No transfers match your current search criteria.
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
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransferPage;
