import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Key, CheckCircle, EyeOff, Eye } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(true);

  useEffect(() => {
    const handleAuthChange = async () => {
      try {
        console.log('🔍 RESET: Checking for password reset token...');
        console.log('🔍 RESET: Full URL:', window.location.href);
        console.log('🔍 RESET: Hash:', window.location.hash);
        console.log('🔍 RESET: Search:', window.location.search);
        
        // Check for hash fragments (Supabase format)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('🔍 RESET: Hash params - type:', type, 'accessToken:', accessToken ? 'present' : 'missing');

        // Also check URL search params as backup
        const urlParams = new URLSearchParams(window.location.search);
        const urlAccessToken = urlParams.get('access_token');
        const urlType = urlParams.get('type');

        console.log('🔍 RESET: URL params - type:', urlType, 'accessToken:', urlAccessToken ? 'present' : 'missing');

        // Check if this is a password recovery request
        if (type === 'recovery' || urlType === 'recovery') {
          const token = accessToken || urlAccessToken;
          if (token) {
            console.log('✅ RESET: Valid recovery token found, setting session...');
            
            // Set the session with the token from URL
            const { data, error } = await supabase.auth.setSession({
              access_token: token,
              refresh_token: refreshToken || ''
            });
            
            if (error) {
              console.error('❌ RESET: Failed to set session:', error);
              setValidToken(false);
              setError('Invalid or expired reset link. Please request a new password reset.');
              return;
            }
            
            console.log('✅ RESET: Session set successfully');
            setValidToken(true);
            return;
          }
        }

        // Also check current auth session
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔍 RESET: Current session check:', session ? 'session exists' : 'no session', error ? `error: ${error.message}` : 'no error');
        
        if (session && !error) {
          console.log('✅ RESET: Valid auth session found');
          setValidToken(true);
          return;
        }

        // If we get here, no valid token found
        console.log('❌ RESET: No valid token or session found');
        setValidToken(false);
        setError('Invalid or expired reset link. Please request a new password reset.');
      } catch (err) {
        console.error('❌ RESET: Auth check error:', err);
        setValidToken(false);
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    };

    handleAuthChange();

    // Listen for auth state changes (important for password reset flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 RESET: Auth state change:', event, session ? 'session exists' : 'no session');
      if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ RESET: PASSWORD_RECOVERY event detected');
        setValidToken(true);
        setError('');
      } else if (event === 'SIGNED_IN' && session) {
        console.log('✅ RESET: SIGNED_IN event detected');
        setValidToken(true);
        setError('');
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({ 
        password: formData.password 
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Invalid token state
  if (!validToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/login" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img 
                src="/unseaflogo.PNG" 
                alt="UNSEAF Logo"
                className="h-12 w-12"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">UNSEAF</h1>
                <p className="text-sm text-gray-500">sustainability. innovation. acceleration.</p>
              </div>
            </div>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-red-800">Invalid Reset Link</CardTitle>
              <CardDescription>
                This password reset link is invalid or has expired
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Password reset links expire after 24 hours for security reasons.
                </p>
                <div className="space-y-3">
                  <Link 
                    to="/forgot-password" 
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-center font-medium"
                  >
                    Request New Reset Link
                  </Link>
                  <Link to="/login" className="block text-blue-600 hover:text-blue-700 font-medium">
                    Return to Login
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img 
                src="/unseaflogo.PNG" 
                alt="UNSEAF Logo"
                className="h-12 w-12"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">UNSEAF</h1>
                <p className="text-sm text-gray-500">sustainability. innovation. acceleration.</p>
              </div>
            </div>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-800">Password Reset Successfully!</CardTitle>
              <CardDescription>
                Your password has been updated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
                <p className="text-sm text-gray-500">
                  You will be redirected to the login page in a few seconds...
                </p>
                <Link 
                  to="/login" 
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-center font-medium"
                >
                  Sign In Now
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main reset password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/login" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Link>
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="/unseaflogo.PNG" 
              alt="UNSEAF Logo"
              className="h-12 w-12"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">UNSEAF</h1>
              <p className="text-sm text-gray-500">sustainability. innovation. acceleration.</p>
            </div>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Password must be at least 6 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;