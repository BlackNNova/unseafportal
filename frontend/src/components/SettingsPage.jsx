import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Eye, 
  EyeOff,
  Save,
  Bell,
  Globe,
  CreditCard,
  Lock,
  KeyRound,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { supabase, auth } from '@/utils/supabase';
import PinSetup from './PinSetup';
import { deleteUserPin } from '@/utils/pinUtils';

const SettingsPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('account');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [pinStatus, setPinStatus] = useState(null);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zip_code: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    fetchUserData();
    fetchPinStatus();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await auth.getCurrentUser();
      
      if (userData) {
        setUser(userData);
        setProfileData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          mobile: userData.phone_number || userData.mobile || '',
          address: userData.address || '',
          city: userData.city || '',
        state: userData.state || '',
        country: userData.nationality || userData.country || '',
        zip_code: userData.zip_code || ''
      });
    } else {
      // Don't redirect - ProtectedRoute handles authentication
      console.warn('No user data found in SettingsPage');
    }
  } catch (err) {
    // Don't navigate away on error - show error to user instead
    setError('Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPinStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_pins')
        .select('id, failed_attempts, locked_until, created_at')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching PIN status:', error);
        return;
      }

      if (data) {
        const now = new Date();
        const lockedUntil = data.locked_until ? new Date(data.locked_until) : null;
        const isLocked = lockedUntil && now < lockedUntil;
        
        setPinStatus({
          hasPin: true,
          failedAttempts: data.failed_attempts,
          isLocked: isLocked,
          lockedUntil: lockedUntil,
          createdAt: new Date(data.created_at)
        });
      } else {
        setPinStatus({ hasPin: false });
      }
    } catch (error) {
      console.error('Error checking PIN status:', error);
    }
  };

  const handleDeletePin = async () => {
    if (!confirm('Are you sure you want to delete your PIN? You will need to set up a new PIN before making withdrawals.')) {
      return;
    }

    setPinLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const result = await deleteUserPin(user.id);
      
      if (result.success) {
        setSuccess('PIN deleted successfully!');
        setPinStatus({ hasPin: false });
      } else {
        setError(result.error || 'Failed to delete PIN');
      }
    } catch (error) {
      console.error('Error deleting PIN:', error);
      setError('Failed to delete PIN. Please try again.');
    } finally {
      setPinLoading(false);
    }
  };

  const handlePinSetupSuccess = () => {
    setSuccess('PIN set up successfully!');
    fetchPinStatus(); // Refresh PIN status
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Only update fields that are editable (exclude read-only fields)
      const { data, error } = await supabase
        .from('users')
        .update({
          // Exclude read-only fields: first_name, last_name, email, grant_number, account_number
          phone_number: profileData.mobile,
          nationality: profileData.country,
          address: profileData.address,
          city: profileData.city,
          state: profileData.state,
          zip_code: profileData.zip_code
        })
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      
      setSuccess('Profile updated successfully!');
      setUser(data);
    } catch (err) {
      setError(err.message || 'Profile update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      });
      
      if (error) throw error;
      
      setSuccess('Password changed successfully!');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (err) {
      setError(err.message || 'Password change failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const sectionItems = [
    { id: 'account', label: 'Account Information', icon: CreditCard },
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Globe }
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p className="text-gray-600">Manage your account preferences and security settings</p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {sectionItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        isActive ? 'bg-blue-100 text-orange-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {/* Account Information */}
          {activeSection === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Account Information</span>
                </CardTitle>
                <CardDescription>
                  View your account details and identifiers (read-only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <Label className="text-sm font-medium text-blue-700 mb-2 block">Account ID</Label>
                    <p className="font-mono font-bold text-xl text-blue-900 break-all">
                      {user?.account_number || 'Not Available'}
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      This is your unique account identifier
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <Label className="text-sm font-medium text-green-700 mb-2 block">Grant Number</Label>
                    <p className="font-mono font-bold text-xl text-green-900 break-all">
                      {user?.grant_number || 'Not Available'}
                    </p>
                    <p className="text-xs text-green-600 mt-2">
                      Use this to login to your account
                    </p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Full Name</Label>
                    <p className="font-bold text-xl text-gray-900">
                      {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Not Available'}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      This is your registered name on the account
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <Label className="text-sm font-medium text-purple-700 mb-2 block">Account Status</Label>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user?.account_status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : user?.account_status === 'pending'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user?.account_status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                    <p className="text-xs text-purple-600 mt-2">
                      Your current account approval status
                    </p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Lock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">Security Notice</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    These account identifiers cannot be changed for security reasons. If you need assistance with your account information, please contact support.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Profile Settings */}
          {activeSection === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={profileData.first_name}
                        placeholder="First Name"
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Name cannot be changed for security reasons</p>
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={profileData.last_name}
                        placeholder="Last Name"
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Name cannot be changed for security reasons</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          className="pl-10 bg-gray-50"
                          placeholder="Enter your email"
                          disabled
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed for security reasons</p>
                    </div>
                    <div>
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="mobile"
                          value={profileData.mobile}
                          onChange={(e) => setProfileData({...profileData, mobile: e.target.value})}
                          className="pl-10"
                          placeholder="Enter your mobile number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Account Details - Read Only */}
                  <div className="grid md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div>
                      <Label htmlFor="grant_number" className="text-blue-700">Grant Number</Label>
                      <Input
                        id="grant_number"
                        value={user?.grant_number || 'Not Available'}
                        disabled
                        className="bg-white border-blue-200 text-blue-900 font-mono"
                      />
                      <p className="text-xs text-blue-600 mt-1">This is your login identifier</p>
                    </div>
                    <div>
                      <Label htmlFor="account_number" className="text-blue-700">Account Number</Label>
                      <Input
                        id="account_number"
                        value={user?.account_number || 'Not Available'}
                        disabled
                        className="bg-white border-blue-200 text-blue-900 font-mono"
                      />
                      <p className="text-xs text-blue-600 mt-1">Your unique account ID</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                        className="pl-10"
                        placeholder="Enter your street address"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profileData.city}
                        onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={profileData.state}
                        onChange={(e) => setProfileData({...profileData, state: e.target.value})}
                        placeholder="State/Province"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip_code">ZIP/Postal Code</Label>
                      <Input
                        id="zip_code"
                        value={profileData.zip_code}
                        onChange={(e) => setProfileData({...profileData, zip_code: e.target.value})}
                        placeholder="ZIP Code"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={profileData.country}
                      onChange={(e) => setProfileData({...profileData, country: e.target.value})}
                      placeholder="Country"
                    />
                  </div>

                  <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Profile
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              {/* Change Password */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="h-5 w-5" />
                    <span>Change Password</span>
                  </CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <Label htmlFor="current_password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current_password"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                          placeholder="Enter current password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="new_password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new_password"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                          placeholder="Enter new password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="confirm_password">Confirm New Password</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Changing...
                        </>
                      ) : (
                        'Change Password'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Transaction PIN Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <KeyRound className="h-5 w-5" />
                    <span>Transaction PIN</span>
                  </CardTitle>
                  <CardDescription>
                    Secure your withdrawals and payments with a 6-digit PIN
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {pinStatus === null ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <>
                      {/* PIN Status Display */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className={`p-4 rounded-lg border-2 ${
                          pinStatus.hasPin 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-orange-50 border-orange-200'
                        }`}>
                          <div className="flex items-center space-x-2 mb-2">
                            {pinStatus.hasPin ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-orange-600" />
                            )}
                            <span className={`font-medium ${
                              pinStatus.hasPin ? 'text-green-700' : 'text-orange-700'
                            }`}>
                              PIN Status
                            </span>
                          </div>
                          <p className={`text-sm ${
                            pinStatus.hasPin ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {pinStatus.hasPin ? 'PIN is set up' : 'No PIN configured'}
                          </p>
                          {pinStatus.hasPin && pinStatus.createdAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Set up on {pinStatus.createdAt.toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        {pinStatus.hasPin && (
                          <div className={`p-4 rounded-lg border-2 ${
                            pinStatus.isLocked 
                              ? 'bg-red-50 border-red-200' 
                              : pinStatus.failedAttempts > 0
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-blue-50 border-blue-200'
                          }`}>
                            <div className="flex items-center space-x-2 mb-2">
                              {pinStatus.isLocked ? (
                                <Lock className="h-5 w-5 text-red-600" />
                              ) : pinStatus.failedAttempts > 0 ? (
                                <Clock className="h-5 w-5 text-yellow-600" />
                              ) : (
                                <Shield className="h-5 w-5 text-blue-600" />
                              )}
                              <span className={`font-medium ${
                                pinStatus.isLocked 
                                  ? 'text-red-700' 
                                  : pinStatus.failedAttempts > 0
                                  ? 'text-yellow-700'
                                  : 'text-blue-700'
                              }`}>
                                Security Status
                              </span>
                            </div>
                            <p className={`text-sm ${
                              pinStatus.isLocked 
                                ? 'text-red-600' 
                                : pinStatus.failedAttempts > 0
                                ? 'text-yellow-600'
                                : 'text-blue-600'
                            }`}>
                              {pinStatus.isLocked 
                                ? `Locked until ${pinStatus.lockedUntil.toLocaleTimeString()}`
                                : pinStatus.failedAttempts > 0
                                ? `${pinStatus.failedAttempts} failed attempts`
                                : 'PIN is secure'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* PIN Actions */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        {!pinStatus.hasPin ? (
                          <Button
                            onClick={() => setShowPinSetup(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={pinLoading}
                          >
                            <KeyRound className="h-4 w-4 mr-2" />
                            Set Up PIN
                          </Button>
                        ) : (
                          <>
                            <Button
                              onClick={() => setShowPinSetup(true)}
                              variant="outline"
                              disabled={pinLoading || pinStatus.isLocked}
                            >
                              <KeyRound className="h-4 w-4 mr-2" />
                              Change PIN
                            </Button>
                            <Button
                              onClick={handleDeletePin}
                              variant="outline"
                              disabled={pinLoading}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              {pinLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                              ) : (
                                <XCircle className="h-4 w-4 mr-2" />
                              )}
                              Remove PIN
                            </Button>
                          </>
                        )}
                      </div>

                      {/* PIN Requirements */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">PIN Security Requirements</span>
                        </div>
                        <ul className="text-xs text-blue-600 space-y-1">
                          <li>• Must be exactly 6 digits</li>
                          <li>• No repeated digits (e.g., 111111)</li>
                          <li>• No sequential patterns (e.g., 123456)</li>
                          <li>• Required for all withdrawals and payments</li>
                          <li>• Account locks for 30 minutes after 3 failed attempts</li>
                        </ul>
                      </div>

                      {/* PIN Usage Info */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">When is my PIN required?</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          <li>• Making withdrawal requests</li>
                          <li>• Processing project payments</li>
                          <li>• Transferring funds</li>
                          <li>• Any transaction above $100</li>
                        </ul>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified about account activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Receive updates about transactions and account activity</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">SMS Notifications</h4>
                      <p className="text-sm text-gray-600">Get text messages for important account updates</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Security Alerts</h4>
                      <p className="text-sm text-gray-600">Alerts about login attempts and security changes</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enabled
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preferences */}
          {activeSection === 'preferences' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Account Preferences</span>
                </CardTitle>
                <CardDescription>
                  Customize your account settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Language</h4>
                      <p className="text-sm text-gray-600">Choose your preferred language</p>
                    </div>
                    <select className="border rounded px-3 py-1 text-sm">
                      <option>English</option>
                      <option>German</option>
                      <option>French</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Currency Display</h4>
                      <p className="text-sm text-gray-600">How amounts are displayed</p>
                    </div>
                    <select className="border rounded px-3 py-1 text-sm">
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                      <option>GBP (£)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Time Zone</h4>
                      <p className="text-sm text-gray-600">Your local time zone</p>
                    </div>
                    <select className="border rounded px-3 py-1 text-sm">
                      <option>UTC+1 (Central European Time)</option>
                      <option>UTC+0 (Greenwich Mean Time)</option>
                      <option>UTC-5 (Eastern Standard Time)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
      
      {/* PIN Setup Modal */}
      <PinSetup
        isOpen={showPinSetup}
        onClose={() => setShowPinSetup(false)}
        onSuccess={handlePinSetupSuccess}
        userName={user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim()}
      />
    </Layout>
  );
};

export default SettingsPage;