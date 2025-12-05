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
import { Search, AlertCircle, Send, ArrowLeft, Building, Users, CircleDollarSign, RefreshCcw, ShieldCheck, History, AlertTriangle, Briefcase, HardHat, GraduationCap, Globe, CreditCard, MapPin } from 'lucide-react';
import { supabase } from '@/utils/supabase';

const ProjectPaymentsPage = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trxSearch, setTrxSearch] = useState('');
  const [dateSearch, setDateSearch] = useState('');
  const [activeTab, setActiveTab] = useState('new_payment');
  const [kycStatus, setKycStatus] = useState(null);
  
  // Enhanced error handling for project payments
  const PROJECT_PAYMENT_ERRORS = {
    INVALID_CATEGORY: 'Please select a valid project category',
    INSUFFICIENT_BALANCE: 'Insufficient project funds for this payment',
    RECIPIENT_VALIDATION: 'Recipient details are required for project payments',
    AMOUNT_VALIDATION: 'Payment amount must be greater than $0.01',
    DATABASE_CONSTRAINT: 'Payment request violates project constraints',
    NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
    AUTHENTICATION_ERROR: 'Authentication failed. Please log in again.',
    PERMISSION_ERROR: 'You do not have permission to create project payments',
    VALIDATION_ERROR: 'Please correct the form errors before submitting',
    DUPLICATE_PAYMENT: 'A similar payment request already exists',
    CATEGORY_CONSTRAINT: 'Invalid project category selected'
  };
  
  // Project Payment form state
  const [paymentForm, setPaymentForm] = useState({
    recipient_name: '',
    recipient_details: {
      account_number: '',
      bank_name: '',
      contact_phone: '',
      address: '',
      swift_code: '',
      iban: '',
      routing_number: '',
      bank_country: '',
      currency: 'USD',
      // Category-specific fields
      employee_id: '',
      contract_number: '',
      license_number: '',
      tax_id: '',
      company_registration: ''
    },
    amount: '',
    purpose_description: '',
    category: '',
    project_phase: '',
    payment_type: 'domestic' // domestic or international
  });
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Project Categories - 8 categories with specific fields
  const PROJECT_CATEGORIES = {
    'contractors_suppliers': {
      label: 'Contractors & Suppliers',
      icon: HardHat,
      description: 'Payments to contractors and suppliers',
      requiredFields: ['contract_number', 'company_registration'],
      placeholders: {
        recipient_name: 'Contractor/Supplier Company Name',
        contract_number: 'Contract Reference Number',
        company_registration: 'Business Registration Number'
      }
    },
    'professional_services': {
      label: 'Professional Services',
      icon: Briefcase,
      description: 'Legal, consulting, and professional services',
      requiredFields: ['license_number', 'tax_id'],
      placeholders: {
        recipient_name: 'Professional Service Provider',
        license_number: 'Professional License Number',
        tax_id: 'Tax ID / VAT Number'
      }
    },
    'staff_personnel': {
      label: 'Staff & Personnel',
      icon: Users,
      description: 'Staff salaries and personnel costs',
      requiredFields: ['employee_id'],
      placeholders: {
        recipient_name: 'Employee Full Name',
        employee_id: 'Employee ID Number'
      }
    },
    'utilities_operations': {
      label: 'Utilities & Operations',
      icon: Building,
      description: 'Operational expenses and utilities',
      requiredFields: [],
      placeholders: {
        recipient_name: 'Utility Provider / Service Name',
        account_number: 'Account/Reference Number'
      }
    },
    'equipment_assets': {
      label: 'Equipment & Assets',
      icon: Building,
      description: 'Equipment purchases and asset investments',
      requiredFields: ['contract_number'],
      placeholders: {
        recipient_name: 'Equipment Vendor Name',
        contract_number: 'Purchase Order / Invoice Number'
      }
    },
    'training_capacity': {
      label: 'Training & Capacity Building',
      icon: GraduationCap,
      description: 'Training programs and capacity development',
      requiredFields: [],
      placeholders: {
        recipient_name: 'Training Provider / Institution',
        purpose_description: 'Training program details and participant information'
      }
    },
    'community_services': {
      label: 'Community Services',
      icon: Users,
      description: 'Community outreach and services',
      requiredFields: [],
      placeholders: {
        recipient_name: 'Service Provider / Organization',
        purpose_description: 'Service description and beneficiary information'
      }
    },
    'administrative': {
      label: 'Administrative Expenses',
      icon: Briefcase,
      description: 'General administrative costs',
      requiredFields: [],
      placeholders: {
        recipient_name: 'Vendor/Service Provider Name'
      }
    }
  };

  // Check KYC status (fallback validation)
  useEffect(() => {
    checkKYCStatus();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, []);

  const checkKYCStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Don't redirect - ProtectedRoute handles authentication
        console.warn('No user found in ProjectPayments KYC check');
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
        console.log('🚫 Project Payments Page: KYC not approved, redirecting to dashboard');
        alert('Your KYC verification must be approved to access project payments.');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error checking KYC status:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to view project payments');
        return;
      }

      // Fetch project payments from Supabase
      let query = supabase
        .from('project_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        throw fetchError;
      }

      setPayments(data || []);
      setFilteredPayments(data || []);
      console.log('Project payments status snapshot:', (data || []).map(p => ({ transaction_number: p.transaction_number, status: p.status })));
    } catch (err) {
      console.error('Error fetching project payments:', err);
      setError('Failed to load project payments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    let results = payments;

    if (trxSearch) {
      results = results.filter(p => 
        p.transaction_number?.toLowerCase().includes(trxSearch.toLowerCase())
      );
    }

    if (dateSearch) {
      results = results.filter(p => {
        const paymentDate = new Date(p.created_at).toISOString().split('T')[0];
        return paymentDate === dateSearch;
      });
    }
    
    setFilteredPayments(results);
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    
    // Enhanced form validation
    const validationErrors = [];
    if (!paymentForm.recipient_name?.trim()) validationErrors.push('Vendor/Contractor name is required');
    if (!paymentForm.category) validationErrors.push(PROJECT_PAYMENT_ERRORS.INVALID_CATEGORY);
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) validationErrors.push(PROJECT_PAYMENT_ERRORS.AMOUNT_VALIDATION);
    if (!paymentForm.purpose_description?.trim()) validationErrors.push('Project purpose description is required');
    
    if (validationErrors.length > 0) {
      setError(`${PROJECT_PAYMENT_ERRORS.VALIDATION_ERROR}:\n• ${validationErrors.join('\n• ')}`);
      return;
    }

    try {
      setPaymentLoading(true);
      setError(''); // Clear previous errors
      
      console.log('🚀 Project Payment Creation: Starting payment request...');
      
      // Get current user with enhanced error handling
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        throw new Error(PROJECT_PAYMENT_ERRORS.AUTHENTICATION_ERROR);
      }
      if (!user) {
        throw new Error('Please log in to create project payments');
      }
      
      console.log('✅ Project Payment Creation: User authenticated:', user.id);

      // Validate amount and calculate fees
      const amount = parseFloat(paymentForm.amount);
      if (isNaN(amount) || amount <= 0.01) {
        throw new Error(PROJECT_PAYMENT_ERRORS.AMOUNT_VALIDATION);
      }
      
      const fee = amount * 0.015; // 1.5% fee for project payments
      const totalDeduction = amount + fee; // Total deducted from user's balance
      const netAmount = amount * 0.985; // Net amount recipient receives (amount - fee)
      
      console.log('💰 Project Payment Calculation:', {
        paymentAmount: amount,
        processingFee: fee,
        totalDeduction: totalDeduction,
        netToRecipient: netAmount,
        category: paymentForm.category
      });

      // Check user balance before proceeding
      const { data: userProfile, error: balanceError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user.id)
        .single();
      
      if (balanceError) {
        throw new Error('Failed to verify account balance');
      }
      
      if (!userProfile || userProfile.balance < totalDeduction) {
        throw new Error(`Insufficient balance. You need $${totalDeduction.toFixed(2)} (payment + fee) but have $${(userProfile?.balance || 0).toFixed(2)}`);
      }
      
      console.log('✅ Balance Check: Sufficient funds', {
        currentBalance: userProfile.balance,
        required: totalDeduction,
        remaining: userProfile.balance - totalDeduction
      });

      // Prepare payment data with enhanced structure
      const paymentData = {
        user_id: user.id,
        category: paymentForm.category,
        recipient_name: paymentForm.recipient_name.trim(),
        recipient_details: {
          ...paymentForm.recipient_details,
          created_via: 'project_payments_portal',
          submission_timestamp: new Date().toISOString()
        },
        amount: amount,
        fee: fee,
        net_amount: netAmount,
        purpose_description: paymentForm.purpose_description.trim(),
        project_phase: paymentForm.project_phase?.trim() || 'Phase 1',
        status: 'pending'
      };
      
      console.log('📝 Project Payment Data:', paymentData);

      // Insert project payment record with enhanced error handling
      const { data: insertedPayment, error: insertError } = await supabase
        .from('project_payments')
        .insert(paymentData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Database Error:', insertError);
        console.error('Full error details:', JSON.stringify(insertError, null, 2));
        
        // Handle specific database errors
        if (insertError.code === '23505') { // Unique constraint violation
          // Log the specific constraint that failed
          console.error('Unique constraint violated:', insertError.message);
          throw new Error(`${PROJECT_PAYMENT_ERRORS.DUPLICATE_PAYMENT}\n\nPlease try again or contact support if the problem persists.\n\nError details: ${insertError.message}`);
        } else if (insertError.code === '23514') { // Check constraint violation
          if (insertError.message.includes('category')) {
            throw new Error(PROJECT_PAYMENT_ERRORS.CATEGORY_CONSTRAINT);
          }
          throw new Error(PROJECT_PAYMENT_ERRORS.DATABASE_CONSTRAINT);
        } else if (insertError.code === '42501') { // Permission denied
          throw new Error(PROJECT_PAYMENT_ERRORS.PERMISSION_ERROR);
        } else {
          throw new Error(`Database error: ${insertError.message}`);
        }
      }
      
      console.log('✅ Project Payment Created:', insertedPayment);
      console.log('🎯 Transaction Number:', insertedPayment.transaction_number);

      // Process payment atomically (balance deduction + transaction record) using database function
      const { data: processResult, error: processError } = await supabase
        .rpc('process_project_payment', {
          p_user_id: user.id,
          p_amount: amount,
          p_fee: fee,
          p_total_deduction: totalDeduction,
          p_transaction_number: insertedPayment.transaction_number,
          p_category: paymentForm.category,
          p_recipient_name: paymentForm.recipient_name.trim(),
          p_purpose_description: paymentForm.purpose_description.trim()
        });
      
      let newBalance = userProfile.balance;
      
      if (processError) {
        console.error('❌ Payment Processing Error:', processError);
        throw new Error(`Failed to process payment: ${processError.message}`);
      }
      
      if (processResult && processResult.success) {
        newBalance = processResult.new_balance;
        console.log('✅ Payment Processed:', {
          previousBalance: processResult.previous_balance,
          deduction: processResult.deduction,
          newBalance: processResult.new_balance
        });
      }

      const categoryLabel = PROJECT_CATEGORIES[paymentForm.category]?.label || paymentForm.category;
      const successMessage = `✅ Project payment submitted successfully!\n\n` +
        `📋 Payment Details:\n` +
        `• Transaction: ${insertedPayment.transaction_number}\n` +
        `• Category: ${categoryLabel}\n` +
        `• Recipient: ${paymentForm.recipient_name}\n` +
        `• Payment Amount: $${amount.toFixed(2)}\n` +
        `• Processing Fee: $${fee.toFixed(2)}\n` +
        `• Total Deducted: $${totalDeduction.toFixed(2)}\n` +
        `• Recipient Gets: $${netAmount.toFixed(2)}\n\n` +
        (newBalance !== userProfile.balance ? `💰 New Balance: $${newBalance.toFixed(2)}\n\n` : '') +
        `🔄 Status: Pending admin approval\n` +
        `⏱️ Processing time: 2-3 business days`;
      
      alert(successMessage);
      
      // Reset form
      setPaymentForm({
        recipient_name: '',
        recipient_details: {
          account_number: '',
          bank_name: '',
          contact_phone: '',
          address: '',
          swift_code: '',
          iban: '',
          routing_number: '',
          bank_country: '',
          currency: 'USD',
          employee_id: '',
          contract_number: '',
          license_number: '',
          tax_id: '',
          company_registration: ''
        },
        amount: '',
        purpose_description: '',
        category: '',
        project_phase: '',
        payment_type: 'domestic'
      });
      
      // Refresh payments list
      console.log('🔄 Refreshing payments list...');
      await fetchPayments();
      
      // Switch to payment history tab
      setActiveTab('payment_history');
      
    } catch (err) {
      console.error('💥 Project Payment Error:', err);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Failed to create project payment';
      
      if (err.message.includes('fetch')) {
        errorMessage = PROJECT_PAYMENT_ERRORS.NETWORK_ERROR;
      } else if (err.message.includes('authentication') || err.message.includes('auth')) {
        errorMessage = PROJECT_PAYMENT_ERRORS.AUTHENTICATION_ERROR;
      } else if (err.message.includes('permission')) {
        errorMessage = PROJECT_PAYMENT_ERRORS.PERMISSION_ERROR;
      } else if (err.message.includes(PROJECT_PAYMENT_ERRORS.CATEGORY_CONSTRAINT)) {
        errorMessage = PROJECT_PAYMENT_ERRORS.CATEGORY_CONSTRAINT;
      } else if (err.message.includes(PROJECT_PAYMENT_ERRORS.DATABASE_CONSTRAINT)) {
        errorMessage = PROJECT_PAYMENT_ERRORS.DATABASE_CONSTRAINT;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(`❌ ${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
    } finally {
      console.log('🏁 Project Payment Creation: Complete');
      setPaymentLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Processing</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getCategoryBadge = (category) => {
    const categoryInfo = PROJECT_CATEGORIES[category];
    if (!categoryInfo) return <Badge>{category}</Badge>;
    
    const IconComponent = categoryInfo.icon;
    return (
      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
        <IconComponent className="h-3 w-3 mr-1" />
        {categoryInfo.label}
      </Badge>
    );
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
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Project Payments</h1>
              <p className="text-blue-100">Manage project expenses and contractor payments</p>
            </div>
          </div>
          <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
            <ShieldCheck className="h-5 w-5 text-white mr-2" />
            <span className="text-white text-sm font-medium">Secure Project Transactions</span>
          </div>
        </div>
      </div>
      
      <Card className="border border-blue-100 shadow-sm rounded-xl overflow-hidden">  
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start rounded-none bg-gradient-to-r from-blue-500 to-blue-600 p-4 gap-2">
              <TabsTrigger 
                value="new_payment" 
                className="px-6 py-3 text-base font-medium data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:scale-105 transition-all text-white rounded-lg hover:bg-white/20"
              >
                <Send className="h-5 w-5 mr-2" />
                New Payment
              </TabsTrigger>
              <TabsTrigger 
                value="payment_history" 
                className="px-6 py-3 text-base font-medium data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:scale-105 transition-all text-white rounded-lg hover:bg-white/20"
              >
                <History className="h-5 w-5 mr-2" />
                Payment History
              </TabsTrigger>
            </TabsList>

            {/* New Payment Tab */}
            <TabsContent value="new_payment" className="p-6">
              <div className="max-w-2xl mx-auto">
                <div className="mb-8 bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-3">
                    <Send className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-xl font-semibold text-blue-800">Create Project Payment</h2>
                  </div>
                  <p className="text-blue-700">Submit payment requests for project expenses and contractor services.</p>
                </div>

                <form onSubmit={handleCreatePayment} className="space-y-6">
                  {/* Project Category */}
                  <div className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-200 mb-2">
                    <Label htmlFor="category" className="text-blue-700 font-semibold">Project Category *</Label>
                  <Select 
                      value={paymentForm.category} 
                      onValueChange={(value) => {
                        // Reset category-specific fields when category changes
                        setPaymentForm({
                          ...paymentForm, 
                          category: value,
                          recipient_details: {
                            ...paymentForm.recipient_details,
                            employee_id: '',
                            contract_number: '',
                            license_number: '',
                            tax_id: '',
                            company_registration: ''
                          }
                        });
                      }}
                    >
                      <SelectTrigger className="border-blue-200 bg-white focus:ring-blue-500 h-11">
                        <SelectValue placeholder="Select project category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PROJECT_CATEGORIES).map(([value, info]) => {
                          const IconComponent = info.icon;
                          return (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center">
                                <IconComponent className="h-4 w-4 mr-2 text-blue-600" />
                                <div className="flex flex-col">
                                  <span>{info.label}</span>
                                  <span className="text-xs text-gray-500">{info.description}</span>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Recipient Details */}
                  <div className="space-y-4 p-4 bg-white rounded-lg border border-blue-200 mb-2">
                    <h3 className="text-blue-800 font-semibold text-lg mb-3">Recipient Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recipient_name" className="text-blue-700 font-semibold">Recipient Name *</Label>
                        <Input
                          id="recipient_name"
                          value={paymentForm.recipient_name}
                          onChange={(e) => setPaymentForm({...paymentForm, recipient_name: e.target.value})}
                          placeholder={PROJECT_CATEGORIES[paymentForm.category]?.placeholders?.recipient_name || "Enter recipient name"}
                          className="border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="contact_phone" className="text-blue-700 font-semibold">Contact Phone *</Label>
                        <Input
                          id="contact_phone"
                          value={paymentForm.recipient_details.contact_phone}
                          onChange={(e) => setPaymentForm({
                            ...paymentForm, 
                            recipient_details: {...paymentForm.recipient_details, contact_phone: e.target.value}
                          })}
                          placeholder="+1234567890"
                          className="border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Category-Specific Fields */}
                    {paymentForm.category && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-blue-100">
                        {PROJECT_CATEGORIES[paymentForm.category]?.requiredFields?.includes('employee_id') && (
                          <div className="space-y-2">
                            <Label htmlFor="employee_id" className="text-blue-700 font-semibold">Employee ID *</Label>
                            <Input
                              id="employee_id"
                              value={paymentForm.recipient_details.employee_id}
                              onChange={(e) => setPaymentForm({
                                ...paymentForm, 
                                recipient_details: {...paymentForm.recipient_details, employee_id: e.target.value}
                              })}
                              placeholder={PROJECT_CATEGORIES[paymentForm.category]?.placeholders?.employee_id || "Enter employee ID"}
                              className="border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                          </div>
                        )}
                        
                        {PROJECT_CATEGORIES[paymentForm.category]?.requiredFields?.includes('contract_number') && (
                          <div className="space-y-2">
                            <Label htmlFor="contract_number" className="text-blue-700 font-semibold">Contract Number *</Label>
                            <Input
                              id="contract_number"
                              value={paymentForm.recipient_details.contract_number}
                              onChange={(e) => setPaymentForm({
                                ...paymentForm, 
                                recipient_details: {...paymentForm.recipient_details, contract_number: e.target.value}
                              })}
                              placeholder={PROJECT_CATEGORIES[paymentForm.category]?.placeholders?.contract_number || "Enter contract number"}
                              className="border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                          </div>
                        )}
                        
                        {PROJECT_CATEGORIES[paymentForm.category]?.requiredFields?.includes('license_number') && (
                          <div className="space-y-2">
                            <Label htmlFor="license_number" className="text-blue-700 font-semibold">License Number *</Label>
                            <Input
                              id="license_number"
                              value={paymentForm.recipient_details.license_number}
                              onChange={(e) => setPaymentForm({
                                ...paymentForm, 
                                recipient_details: {...paymentForm.recipient_details, license_number: e.target.value}
                              })}
                              placeholder={PROJECT_CATEGORIES[paymentForm.category]?.placeholders?.license_number || "Enter license number"}
                              className="border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                          </div>
                        )}
                        
                        {PROJECT_CATEGORIES[paymentForm.category]?.requiredFields?.includes('tax_id') && (
                          <div className="space-y-2">
                            <Label htmlFor="tax_id" className="text-blue-700 font-semibold">Tax ID / VAT *</Label>
                            <Input
                              id="tax_id"
                              value={paymentForm.recipient_details.tax_id}
                              onChange={(e) => setPaymentForm({
                                ...paymentForm, 
                                recipient_details: {...paymentForm.recipient_details, tax_id: e.target.value}
                              })}
                              placeholder={PROJECT_CATEGORIES[paymentForm.category]?.placeholders?.tax_id || "Enter tax ID"}
                              className="border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                          </div>
                        )}
                        
                        {PROJECT_CATEGORIES[paymentForm.category]?.requiredFields?.includes('company_registration') && (
                          <div className="space-y-2">
                            <Label htmlFor="company_registration" className="text-blue-700 font-semibold">Business Registration *</Label>
                            <Input
                              id="company_registration"
                              value={paymentForm.recipient_details.company_registration}
                              onChange={(e) => setPaymentForm({
                                ...paymentForm, 
                                recipient_details: {...paymentForm.recipient_details, company_registration: e.target.value}
                              })}
                              placeholder={PROJECT_CATEGORIES[paymentForm.category]?.placeholders?.company_registration || "Enter registration number"}
                              className="border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Payment Type Selection */}
                  <div className="space-y-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 mb-2">
                    <Label htmlFor="payment_type" className="text-blue-700 font-semibold flex items-center">
                      <Globe className="h-5 w-5 mr-2 text-blue-600" />
                      Payment Type *
                    </Label>
                    <Select 
                      value={paymentForm.payment_type} 
                      onValueChange={(value) => setPaymentForm({...paymentForm, payment_type: value})}
                    >
                      <SelectTrigger className="border-blue-200 bg-white focus:ring-blue-500 h-11">
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="domestic">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2 text-blue-600" />
                            <span>Domestic Payment</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="international">
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 mr-2 text-indigo-600" />
                            <span>International Payment</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Banking Details */}
                  <div className="space-y-4 p-4 bg-white rounded-lg border border-blue-200 mb-2">
                    <h3 className="text-blue-800 font-semibold text-lg mb-3 flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Banking Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bank_name" className="text-blue-700 font-semibold">Bank Name *</Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-5 w-5" />
                          <Input
                            id="bank_name"
                            value={paymentForm.recipient_details.bank_name}
                            onChange={(e) => setPaymentForm({
                              ...paymentForm, 
                              recipient_details: {...paymentForm.recipient_details, bank_name: e.target.value}
                            })}
                            placeholder="Enter bank name"
                            className="pl-10 border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="account_number" className="text-blue-700 font-semibold">Account Number *</Label>
                        <Input
                          id="account_number"
                          value={paymentForm.recipient_details.account_number}
                          onChange={(e) => setPaymentForm({
                            ...paymentForm, 
                            recipient_details: {...paymentForm.recipient_details, account_number: e.target.value}
                          })}
                          placeholder="Enter account number"
                          className="border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    {/* International Payment Fields */}
                    {paymentForm.payment_type === 'international' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-blue-100">
                        <div className="space-y-2">
                          <Label htmlFor="swift_code" className="text-blue-700 font-semibold">SWIFT/BIC Code *</Label>
                          <Input
                            id="swift_code"
                            value={paymentForm.recipient_details.swift_code}
                            onChange={(e) => setPaymentForm({
                              ...paymentForm, 
                              recipient_details: {...paymentForm.recipient_details, swift_code: e.target.value.toUpperCase()}
                            })}
                            placeholder="e.g., CHASUS33XXX"
                            className="border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500 uppercase"
                            maxLength="11"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="iban" className="text-blue-700 font-semibold">IBAN (if applicable)</Label>
                          <Input
                            id="iban"
                            value={paymentForm.recipient_details.iban}
                            onChange={(e) => setPaymentForm({
                              ...paymentForm, 
                              recipient_details: {...paymentForm.recipient_details, iban: e.target.value.toUpperCase()}
                            })}
                            placeholder="e.g., GB29NWBK60161331926819"
                            className="border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500 uppercase"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="routing_number" className="text-blue-700 font-semibold">Routing Number (if applicable)</Label>
                          <Input
                            id="routing_number"
                            value={paymentForm.recipient_details.routing_number}
                            onChange={(e) => setPaymentForm({
                              ...paymentForm, 
                              recipient_details: {...paymentForm.recipient_details, routing_number: e.target.value}
                            })}
                            placeholder="9-digit routing number"
                            className="border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500"
                            maxLength="9"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bank_country" className="text-blue-700 font-semibold">Bank Country *</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-5 w-5" />
                            <Input
                              id="bank_country"
                              value={paymentForm.recipient_details.bank_country}
                              onChange={(e) => setPaymentForm({
                                ...paymentForm, 
                                recipient_details: {...paymentForm.recipient_details, bank_country: e.target.value}
                              })}
                              placeholder="e.g., United States, United Kingdom"
                              className="pl-10 border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="currency" className="text-blue-700 font-semibold">Currency *</Label>
                          <Select 
                            value={paymentForm.recipient_details.currency} 
                            onValueChange={(value) => setPaymentForm({
                              ...paymentForm,
                              recipient_details: {...paymentForm.recipient_details, currency: value}
                            })}
                          >
                            <SelectTrigger className="border-blue-200 bg-white focus:ring-blue-500 h-11">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                              <SelectItem value="GBP">GBP - British Pound</SelectItem>
                              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                              <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                              <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                              <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                              <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="address" className="text-blue-700 font-semibold">Bank Address</Label>
                      <Input
                        id="address"
                        value={paymentForm.recipient_details.address}
                        onChange={(e) => setPaymentForm({
                          ...paymentForm, 
                          recipient_details: {...paymentForm.recipient_details, address: e.target.value}
                        })}
                        placeholder="Full bank address"
                        className="border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 mb-2">
                    <Label htmlFor="amount" className="text-blue-700 font-semibold flex items-center">
                      <CircleDollarSign className="h-5 w-5 mr-2 text-blue-600" />
                      Payment Amount *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 text-lg font-semibold">$</span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                        placeholder="0.00"
                        className="pl-8 border-blue-200 h-12 text-lg font-medium focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    {paymentForm.amount && (
                      <div className="mt-3 bg-white p-3 rounded-md border border-blue-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">Payment Amount:</span>
                          <span className="font-semibold text-blue-800">${parseFloat(paymentForm.amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">Processing Fee (1.5%):</span>
                          <span className="font-semibold text-red-600">+${(parseFloat(paymentForm.amount || 0) * 0.015).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center font-semibold border-t border-blue-200 pt-2 mt-2">
                          <span className="text-blue-900">Total Deduction from Balance:</span>
                          <span className="text-lg text-red-700">${(parseFloat(paymentForm.amount || 0) * 1.015).toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                          <span className="font-medium">Recipient receives:</span> ${(parseFloat(paymentForm.amount || 0) * 0.985).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Project Purpose */}
                  <div className="space-y-2 p-4 bg-white rounded-lg border border-blue-200 mb-2">
                    <Label htmlFor="purpose_description" className="text-blue-700 font-semibold">Project Purpose *</Label>
                    <Textarea
                      id="purpose_description"
                      value={paymentForm.purpose_description}
                      onChange={(e) => setPaymentForm({...paymentForm, purpose_description: e.target.value})}
                      placeholder="Describe the project purpose and deliverables..."
                      rows={3}
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Project Phase */}
                  <div className="space-y-2 p-4 bg-white rounded-lg border border-blue-200 mb-2">
                    <Label htmlFor="project_phase" className="text-blue-700 font-semibold">Project Phase</Label>
                    <Input
                      id="project_phase"
                      value={paymentForm.project_phase}
                      onChange={(e) => setPaymentForm({...paymentForm, project_phase: e.target.value})}
                      placeholder="e.g., Phase 1, Initial Setup, etc."
                      className="border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 mt-8">
                    <h3 className="text-white font-semibold mb-4 flex items-center">
                      <ShieldCheck className="h-5 w-5 mr-2" />
                      Ready to Submit Payment Request
                    </h3>
                    <div className="flex space-x-4">
                      <Button 
                        type="submit" 
                        className="bg-white hover:bg-blue-50 text-blue-700 flex-1 h-12 font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
                        disabled={paymentLoading}
                      >
                        {paymentLoading ? (
                          <div className="flex items-center justify-center">
                            <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <Send className="h-4 w-4 mr-2" />
                            Submit Payment Request
                          </div>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setPaymentForm({
                          recipient_name: '',
                          recipient_details: {
                            account_number: '',
                            bank_name: '',
                            contact_phone: '',
                            address: '',
                            swift_code: '',
                            iban: '',
                            routing_number: '',
                            bank_country: '',
                            currency: 'USD',
                            employee_id: '',
                            contract_number: '',
                            license_number: '',
                            tax_id: '',
                            company_registration: ''
                          },
                          amount: '',
                          purpose_description: '',
                          category: '',
                          project_phase: '',
                          payment_type: 'domestic'
                        })}
                        className="flex-1 h-12 bg-white/20 border-2 border-white text-white font-semibold hover:bg-white hover:text-blue-700 transition-all duration-200"
                      >
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Reset Form
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </TabsContent>

            {/* Payment History Tab */}
            <TabsContent value="payment_history" className="p-6">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-blue-800 mb-2 flex items-center">
                    <History className="h-5 w-5 mr-2 text-blue-600" />
                    Payment History
                  </h2>
                  <p className="text-blue-600">View and track all your project payment requests</p>
                </div>
                {filteredPayments.length > 0 && (
                  <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                    {filteredPayments.length} {filteredPayments.length === 1 ? 'payment' : 'payments'}
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
                      placeholder="PP-XXXXXXXX-XXXXX" 
                      value={trxSearch} 
                      onChange={(e) => setTrxSearch(e.target.value)} 
                      className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="relative flex-1 w-full md:max-w-xs">
                  <div className="font-medium text-blue-700 mb-2 text-sm">Payment Date</div>
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
                    Search Payments
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto bg-white rounded-lg border border-blue-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                      <th className="py-3 px-4 text-left font-semibold">TRX NO.</th>
                      <th className="py-3 px-4 text-left font-semibold">DATE</th>
                      <th className="py-3 px-4 text-left font-semibold">RECIPIENT</th>
                      <th className="py-3 px-4 text-left font-semibold">CATEGORY</th>
                      <th className="py-3 px-4 text-left font-semibold">PURPOSE</th>
                      <th className="py-3 px-4 text-right font-semibold">AMOUNT</th>
                      <th className="py-3 px-4 text-right font-semibold">FEE</th>
                      <th className="py-3 px-4 text-right font-semibold">NET AMOUNT</th>
                      <th className="py-3 px-4 text-center font-semibold">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length > 0 ? (
                      filteredPayments.map(p => (
                        <tr key={p.id} className="border-b hover:bg-blue-50 transition-colors duration-150">
                          <td className="py-3 px-4 font-mono text-sm font-bold text-blue-600">{p.transaction_number || `PP${p.id.slice(-8)}`}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{formatDate(p.created_at)}</td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{p.recipient_name || 'N/A'}</td>
                          <td className="py-3 px-4 text-sm">{getCategoryBadge(p.category)}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{p.purpose_description || 'N/A'}</td>
                          <td className="py-3 px-4 text-right font-medium text-gray-900">${parseFloat(p.amount || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-sm font-medium text-red-600">-${parseFloat(p.fee || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-bold text-blue-700">${parseFloat(p.net_amount || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">{getStatusBadge(p.status)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="py-20 text-center">
                          <div className="flex flex-col items-center">
                            {loading ? (
                              <>
                                <RefreshCcw className="h-12 w-12 text-blue-400 animate-spin mb-4" />
                                <h3 className="text-xl font-medium text-blue-800 mb-2">Loading payments...</h3>
                                <p className="text-blue-600">
                                  Please wait while we fetch your project payment history.
                                </p>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-12 w-12 text-blue-300 mb-4" />
                                <h3 className="text-xl font-medium text-blue-800 mb-2">No payments found</h3>
                                <p className="text-blue-600">
                                  No project payments match your current search criteria.
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

export default ProjectPaymentsPage;