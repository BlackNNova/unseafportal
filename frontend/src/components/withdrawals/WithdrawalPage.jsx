import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, DollarSign, AlertCircle, CheckCircle, History, BanknoteIcon, Search, FileText, Download, Plus } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { calculateQuarterlyLimits, validateWithdrawalAmount, calculateWithdrawalFee, formatCurrency } from '../../utils/quarterlyUtils';
import WithdrawalMethodSelector from './WithdrawalMethodSelector';
import BankTransferForm from './forms/BankTransferForm';
import WireTransferForm from './forms/WireTransferForm';
import DigitalWalletForm from './forms/DigitalWalletForm';
import CheckForm from './forms/CheckForm';
import PinVerification from '../PinVerification';
import ReceiptModal from '../receipts/ReceiptModal';
import '../../styles/banking.css';

const WithdrawalPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('new-withdrawal');
  const [step, setStep] = useState(1); // 1: Amount, 2: Method, 3: Details, 4: PIN, 5: Success
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [methodDetails, setMethodDetails] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [grantData, setGrantData] = useState(null);
  const [quarterlyLimits, setQuarterlyLimits] = useState(null);
  const [feeCalculation, setFeeCalculation] = useState(null);
  const [transactionNumber, setTransactionNumber] = useState('');
  const [hasPin, setHasPin] = useState(false);
  const [checkingPin, setCheckingPin] = useState(true);
  const [updatedBalance, setUpdatedBalance] = useState(null);
  const [updatedQuarterly, setUpdatedQuarterly] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  
  // History tab state
  const [withdrawals, setWithdrawals] = useState([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Check KYC status (fallback validation)
  useEffect(() => {
    checkKYCStatus();
  }, []);

  // Check if user has PIN set up
  useEffect(() => {
    checkPinStatus();
  }, []);

  // Load grant data
  useEffect(() => {
    loadGrantData();
  }, []);

  // Load withdrawals history when history tab is active
  useEffect(() => {
    if (activeTab === 'history') {
      loadWithdrawals();
    }
  }, [activeTab]);

  // Filter withdrawals when search term changes
  useEffect(() => {
    filterWithdrawals();
  }, [searchTerm, withdrawals]);

  const checkKYCStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Don't redirect - ProtectedRoute handles authentication
        console.warn('No user found in checkKYCStatus, but ProtectedRoute will handle');
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
        console.log('🚫 Withdrawal Page: KYC not approved, redirecting to dashboard');
        alert('Your KYC verification must be approved to access withdrawals.');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error checking KYC status:', error);
    }
  };

  const checkPinStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Don't redirect - ProtectedRoute handles authentication
        console.warn('No user found in checkPinStatus, but ProtectedRoute will handle');
        return;
      }

      const { data, error } = await supabase
        .from('user_pins')
        .select('id')
        .eq('user_id', user.id)
        .single();

      setHasPin(!!data);
      setCheckingPin(false);

      // If no PIN, redirect to settings to set it up
      if (!data) {
        alert('Please set up your 6-digit PIN in Settings before making a withdrawal.');
        navigate('/settings');
      }
    } catch (error) {
      console.error('Error checking PIN status:', error);
      setCheckingPin(false);
    }
  };

  const loadGrantData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Don't redirect - ProtectedRoute handles authentication
        console.warn('No user found in loadGrantData, but ProtectedRoute will handle');
        return;
      }

      const { data, error } = await supabase
        .from('user_grants')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setGrantData(data);
      const limits = calculateQuarterlyLimits(data);
      setQuarterlyLimits(limits);
    } catch (error) {
      console.error('Error loading grant data:', error);
    }
  };

  // History tab functions
  const loadWithdrawals = async () => {
    try {
      setHistoryLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('No user found in loadWithdrawals');
        return;
      }
      
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
      setHistoryLoading(false);
    }
  };

  const filterWithdrawals = () => {
    if (!searchTerm) {
      setFilteredWithdrawals(withdrawals);
      return;
    }

    const filtered = withdrawals.filter(w => 
      w.transaction_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.status?.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Calculate fee when amount or method changes
  useEffect(() => {
    if (amount && selectedMethod) {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount) && numAmount > 0) {
        const calc = calculateWithdrawalFee(numAmount, selectedMethod);
        setFeeCalculation(calc);
      }
    }
  }, [amount, selectedMethod]);

  const handleAmountSubmit = () => {
    const numAmount = parseFloat(amount);
    
    if (!numAmount || numAmount <= 0) {
      setErrors({ amount: 'Please enter a valid amount' });
      return;
    }

    const validation = validateWithdrawalAmount(numAmount, quarterlyLimits);
    
    if (!validation.isValid) {
      setErrors({ amount: validation.error });
      return;
    }

    setErrors({});
    setStep(2);
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  const handleMethodSubmit = () => {
    if (!selectedMethod) {
      setErrors({ method: 'Please select a withdrawal method' });
      return;
    }
    setErrors({});
    setStep(3);
  };

  const handleDetailsChange = (details) => {
    setMethodDetails(details);
  };

  const validateMethodDetails = () => {
    const newErrors = {};
    
    // Common validations based on method
    if (selectedMethod === 'bank_transfer' || selectedMethod === 'wire_transfer') {
      if (!methodDetails.accountHolderName) newErrors.accountHolderName = 'Account holder name is required';
      if (!methodDetails.bankName) newErrors.bankName = 'Bank name is required';
      if (!methodDetails.accountNumber) newErrors.accountNumber = 'Account number is required';
      if (!methodDetails.routingNumber) newErrors.routingNumber = 'Routing number is required';
      if (!methodDetails.accountType) newErrors.accountType = 'Account type is required';
      if (!methodDetails.bankAddress) newErrors.bankAddress = 'Bank address is required';
      if (!methodDetails.beneficiaryAddress) newErrors.beneficiaryAddress = 'Beneficiary address is required';
      
      if (selectedMethod === 'wire_transfer') {
        if (!methodDetails.swiftCode) newErrors.swiftCode = 'SWIFT/BIC code is required';
        if (!methodDetails.wireInstructions) newErrors.wireInstructions = 'Wire instructions are required';
        if (!methodDetails.beneficiaryPhone) newErrors.beneficiaryPhone = 'Beneficiary phone is required';
      }
    } else if (selectedMethod === 'digital_wallet') {
      if (!methodDetails.walletProvider) newErrors.walletProvider = 'Wallet provider is required';
      if (!methodDetails.walletEmail) newErrors.walletEmail = 'Wallet email/phone is required';
      if (!methodDetails.verificationStatus) newErrors.verificationStatus = 'Verification status is required';
      if (!methodDetails.currency) newErrors.currency = 'Currency is required';
    } else if (selectedMethod === 'check') {
      if (!methodDetails.payeeName) newErrors.payeeName = 'Payee name is required';
      if (!methodDetails.addressLine1) newErrors.addressLine1 = 'Address is required';
      if (!methodDetails.city) newErrors.city = 'City is required';
      if (!methodDetails.state) newErrors.state = 'State/Province is required';
      if (!methodDetails.zipCode) newErrors.zipCode = 'ZIP/Postal code is required';
      if (!methodDetails.country) newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDetailsSubmit = () => {
    if (!validateMethodDetails()) {
      return;
    }
    setStep(4); // Go to PIN verification
  };

  const handlePinVerified = async () => {
    console.log('🚀 Withdrawal Creation: PIN verified successfully, starting withdrawal creation...');
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('✅ Withdrawal Creation: User authenticated, userId:', user.id);
      
      // Log all the data we're about to insert
      const withdrawalData = {
        user_id: user.id,
        amount: parseFloat(amount),
        fee: feeCalculation?.fee || 0,
        net_amount: feeCalculation?.netAmount || parseFloat(amount),
        method: selectedMethod,
        method_details: methodDetails,
        status: 'pending',
        quarter_period: quarterlyLimits?.currentQuarterPeriod,
        quarter_limit: quarterlyLimits?.currentQuarterLimit,
        quarter_used_before: quarterlyLimits?.currentQuarterUsed,
        quarter_remaining_after: quarterlyLimits ? quarterlyLimits.currentQuarterRemaining - parseFloat(amount) : 0,
        expected_completion_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      console.log('📝 Withdrawal Creation: Data to insert:', withdrawalData);
      
      // Create withdrawal record
      console.log('💾 Withdrawal Creation: Inserting into withdrawals table...');
      const { data, error } = await supabase
        .from('withdrawals')
        .insert(withdrawalData)
        .select()
        .single();

      if (error) {
        console.error('❌ Withdrawal Creation: Database error:', error);
        throw error;
      }
      
      console.log('✅ Withdrawal Creation: Success! Withdrawal record created:', data);
      console.log('🎯 Withdrawal Creation: Transaction number:', data.transaction_number);

      setTransactionNumber(data.transaction_number);
      
      // Fetch updated balance and quarterly limits
      console.log('💰 Withdrawal Creation: Fetching updated balance...');
      const { data: updatedGrant, error: grantError } = await supabase
        .from('user_grants')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (!grantError && updatedGrant) {
        console.log('✅ Withdrawal Creation: Updated balance fetched:', updatedGrant.current_balance);
        setUpdatedBalance(updatedGrant.current_balance);
        const updatedLimits = calculateQuarterlyLimits(updatedGrant);
        setUpdatedQuarterly(updatedLimits);
        console.log('✅ Withdrawal Creation: Updated quarterly limits:', updatedLimits);
      }
      
      console.log('📄 Withdrawal Creation: Advancing to step 5 (Success screen)');
      setStep(5); // Success
    } catch (error) {
      console.error('💥 Withdrawal Creation: Error:', error);
      console.error('💥 Withdrawal Creation: Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      setErrors({ submit: `Failed to submit withdrawal: ${error.message}` });
    } finally {
      console.log('🏁 Withdrawal Creation: Setting loading to false');
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Withdrawal Amount
              </h2>
              <p className="text-gray-600">
                Enter the amount you wish to withdraw
              </p>
            </div>

            {quarterlyLimits && (
              <div className="highlight-box">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Available Balance</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(quarterlyLimits.currentBalance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{quarterlyLimits.currentQuarter} Remaining</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(quarterlyLimits.currentQuarterRemaining)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Quarter Period: {quarterlyLimits.currentQuarterPeriod} • 
                  Days Remaining: {quarterlyLimits.daysRemainingInQuarter}
                </p>
              </div>
            )}

            <div className="banking-form-group">
              <Label htmlFor="amount" className="banking-form-label required">
                Withdrawal Amount ($)
              </Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={`pl-4 text-2xl font-semibold ${errors.amount ? 'banking-form-input error' : 'banking-form-input'}`}
                  />
              </div>
              {errors.amount && (
                <p className="banking-form-error">{errors.amount}</p>
              )}
            </div>

            <Button
              onClick={handleAmountSubmit}
              className="w-full banking-button"
              size="lg"
            >
              Continue
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <WithdrawalMethodSelector
              selectedMethod={selectedMethod}
              onMethodSelect={handleMethodSelect}
            />
            
            {feeCalculation && (
              <div className="highlight-box">
                <div className="info-grid">
                  <span className="info-label">Withdrawal Amount:</span>
                  <span className="info-value font-semibold">{formatCurrency(feeCalculation.amount)}</span>
                  
                  <span className="info-label">Processing Fee:</span>
                  <span className="info-value">{formatCurrency(feeCalculation.fee)}</span>
                  
                  <span className="info-label">Net Amount:</span>
                  <span className="info-value font-bold text-lg">{formatCurrency(feeCalculation.netAmount)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleMethodSubmit}
                className="flex-1 banking-button"
                disabled={!selectedMethod}
              >
                Continue
              </Button>
            </div>
          </div>
        );

      case 3:
        const FormComponent = {
          bank_transfer: BankTransferForm,
          wire_transfer: WireTransferForm,
          digital_wallet: DigitalWalletForm,
          check: CheckForm
        }[selectedMethod];

        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Details
              </h2>
              <p className="text-gray-600">
                Enter your {selectedMethod.replace('_', ' ')} information
              </p>
            </div>

            {FormComponent && (
              <FormComponent
                formData={methodDetails}
                onChange={handleDetailsChange}
                errors={errors}
              />
            )}

            <div className="flex gap-4">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleDetailsSubmit}
                className="flex-1 banking-button"
              >
                Continue to PIN Verification
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verify Your Identity
              </h2>
              <p className="text-gray-600">
                Enter your 6-digit PIN to confirm this withdrawal
              </p>
            </div>

            <div className="highlight-box mb-6">
              <h3 className="font-semibold mb-4">Withdrawal Summary</h3>
              <div className="info-grid">
                <span className="info-label">Amount:</span>
                <span className="info-value">{formatCurrency(parseFloat(amount))}</span>
                
                <span className="info-label">Fee:</span>
                <span className="info-value">{formatCurrency(feeCalculation.fee)}</span>
                
                <span className="info-label">Net Amount:</span>
                <span className="info-value font-bold">{formatCurrency(feeCalculation.netAmount)}</span>
                
                <span className="info-label">Method:</span>
                <span className="info-value capitalize">{selectedMethod.replace('_', ' ')}</span>
              </div>
            </div>

            <PinVerification
              isOpen={true}
              onClose={() => setStep(3)}
              onSuccess={handlePinVerified}
              transactionDetails={{
                type: 'withdrawal',
                amount: parseFloat(amount),
                fee: feeCalculation?.fee || 0,
                method: selectedMethod,
                recipient: methodDetails.accountHolderName || methodDetails.payeeName || 'Bank Account'
              }}
            />

            {errors.submit && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {errors.submit}
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Withdrawal Submitted!
              </h2>
              <p className="text-gray-600">
                Your withdrawal request has been received and is being processed
              </p>
            </div>

            <div className="highlight-box-success">
              <p className="font-semibold mb-2">Transaction Number</p>
              <p className="text-2xl font-bold text-green-700">{transactionNumber}</p>
            </div>

            {/* Updated Balance Information */}
            {updatedBalance !== null && updatedQuarterly && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-900 mb-4">💰 Updated Account Balance</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600 font-medium">New Balance</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(updatedBalance)}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 font-medium">{updatedQuarterly.currentQuarter} Remaining</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(updatedQuarterly.currentQuarterRemaining)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Quarter Used:</span>
                    <span className="font-semibold text-blue-900">{formatCurrency(updatedQuarterly.currentQuarterUsed)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-blue-700">Quarter Limit:</span>
                    <span className="font-semibold text-blue-900">{formatCurrency(updatedQuarterly.currentQuarterLimit)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-lg mb-6">
              <h3 className="font-semibold text-green-900 mb-2">✓ Withdrawal Confirmed!</h3>
              <p className="text-sm text-green-800">
                Your withdrawal of {formatCurrency(parseFloat(amount))} has been processed. 
                Your account balance and quarterly limits have been updated.
              </p>
            </div>

            <div className="text-left bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-4">What happens next?</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>✓ Your request has been recorded in the system</p>
                <p>✓ Processing timeline: 3-5 business days (simulated)</p>
                <p>✓ Receipt is available in your transaction history</p>
                <p>✓ Admin can view your request in the admin dashboard</p>
                <p className="text-xs text-gray-500 mt-4">
                  Note: This is a demonstration system. No actual funds will be transferred.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="flex-1"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={() => setActiveTab('history')}
                className="flex-1 banking-button"
              >
                <History className="h-4 w-4 mr-2" />
                View History
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderHistoryContent = () => {
    if (historyLoading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading withdrawal history...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Search Bar */}
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
                onClick={() => setActiveTab('new-withdrawal')}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(parseFloat(withdrawal.amount || 0))}
                    </p>
                    <p className="text-xs text-gray-500">Gross Amount</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(parseFloat(withdrawal.net_amount || 0))}
                    </p>
                    <p className="text-xs text-gray-500">Net Amount</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getMethodDisplay(withdrawal.method)}
                    </p>
                    <p className="text-xs text-gray-500">Method</p>
                  </div>
                </div>

                {withdrawal.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-700">{withdrawal.description}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    ID: {withdrawal.id}
                  </div>
                  <div className="flex gap-2">
                    {(withdrawal.status === 'completed' || withdrawal.status === 'processing') && (
                      <Button
                        onClick={() => handleViewReceipt(withdrawal.id)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Receipt
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (checkingPin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking PIN status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Card className="banking-card">
          <CardHeader className="banking-card-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <BanknoteIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-2xl">Withdrawals</CardTitle>
                  <CardDescription className="text-blue-100">
                    {activeTab === 'new-withdrawal' ? `Step ${step} of 5` : 'View and manage your withdrawal requests'}
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </CardHeader>

          <CardContent className="banking-card-body">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="new-withdrawal" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Withdrawal
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Withdrawal History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new-withdrawal">
                {renderStepContent()}
              </TabsContent>

              <TabsContent value="history">
                {renderHistoryContent()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Receipt Modal */}
      {receiptModalOpen && (
        <ReceiptModal
          isOpen={receiptModalOpen}
          onClose={() => setReceiptModalOpen(false)}
          withdrawalId={selectedReceipt}
        />
      )}
    </div>
  );
};

export default WithdrawalPage;
