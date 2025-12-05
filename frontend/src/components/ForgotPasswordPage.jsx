import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Supabase password reset - uses configured Hostinger SMTP
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://funding-unseaf.org/reset-password',
      });

      if (error) {
        throw error;
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-800">Email Sent!</CardTitle>
              <CardDescription>
                Check your email for password reset instructions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  We've sent a password reset link to:
                </p>
                <p className="text-lg font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {email}
                </p>
                
                {/* Prominent spam folder warning */}
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 my-4">
                  <p className="text-base font-bold text-yellow-900">
                    ⚠️ IMPORTANT: Check your SPAM/JUNK folder!
                  </p>
                  <p className="text-sm text-yellow-800 mt-1">
                    The email may be filtered as spam. Please check your spam folder if you don't see it in your inbox.
                  </p>
                  <p className="text-sm text-yellow-800 mt-2 font-semibold">
                    📌 Remember to mark the email as "Not Spam" to receive future emails in your inbox.
                  </p>
                </div>

                <div className="text-sm text-gray-500 space-y-2">
                  <p>• The link will expire in 24 hours</p>
                  <p>• Contact support if you need further assistance</p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  ← Return to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a password reset link
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
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Enter the email address associated with your account
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in here
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;