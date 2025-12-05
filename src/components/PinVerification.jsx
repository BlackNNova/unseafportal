/**
 * PIN Verification Modal Component
 * For confirming transactions with 6-digit PIN
 * Used in withdrawal and project payment flows
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { verifyUserPin, hasUserPin, getPinStatus } from '../utils/pinUtils';
import { formatCurrency } from '../utils/currencyFormatter';

const PinVerification = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onSetupRequired,
  transactionData = {},
  loading = false 
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [pinStatus, setPinStatus] = useState(null);

  // Check if user has PIN when modal opens
  useEffect(() => {
    if (isOpen) {
      checkUserPin();
      setPin('');
      setError('');
    }
  }, [isOpen]);

  const checkUserPin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const hasPinResult = await hasUserPin(user.id);
      if (hasPinResult.success && !hasPinResult.hasPin) {
        // User doesn't have a PIN - trigger setup
        onSetupRequired();
        return;
      }

      // Get PIN status for display
      const statusResult = await getPinStatus(user.id);
      if (statusResult.success) {
        setPinStatus(statusResult);
        if (statusResult.status === 'locked') {
          setError(statusResult.message);
        }
      }
    } catch (error) {
      console.error('PIN check error:', error);
    }
  };

  const handlePinInput = (value) => {
    // Only allow digits, max 6 characters
    const cleanedValue = value.replace(/\D/g, '').slice(0, 6);
    setPin(cleanedValue);
    setError(''); // Clear errors when typing
  };

  const handleVerifyPin = async () => {
    if (pin.length !== 6) {
      setError('Please enter your 6-digit PIN');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to continue');
        setVerifying(false);
        return;
      }

      const result = await verifyUserPin(user.id, pin);
      
      if (result.success) {
        // PIN verified successfully
        onSuccess();
      } else {
        setError(result.error);
        
        // If account is locked, update status
        if (result.isLocked) {
          setPinStatus({
            status: 'locked',
            message: result.error,
            minutesRemaining: result.minutesRemaining
          });
        }
        
        // Clear PIN on error for security
        setPin('');
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      setError('Verification failed. Please try again.');
    }

    setVerifying(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && pin.length === 6 && !verifying) {
      handleVerifyPin();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Confirm Transaction
          </h2>
          <p className="text-gray-600">
            Enter your transaction PIN to authorize this payment
          </p>
        </div>

        {/* Transaction Summary */}
        {transactionData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Transaction Details:</h3>
            <div className="space-y-2 text-sm">
              {transactionData.type && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">{transactionData.type}</span>
                </div>
              )}
              {transactionData.amount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-lg text-blue-600">
                    {formatCurrency(transactionData.amount)}
                  </span>
                </div>
              )}
              {transactionData.recipient && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipient:</span>
                  <span className="font-medium">{transactionData.recipient}</span>
                </div>
              )}
              {transactionData.method && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-medium capitalize">{transactionData.method.replace('_', ' ')}</span>
                </div>
              )}
              {transactionData.fee && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee:</span>
                  <span className="font-medium text-orange-600">
                    {formatCurrency(transactionData.fee)}
                  </span>
                </div>
              )}
              {transactionData.netAmount && (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 font-medium">Net Amount:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(transactionData.netAmount)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PIN Status Warning */}
        {pinStatus && pinStatus.status === 'warning' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-yellow-800">{pinStatus.message}</p>
            </div>
          </div>
        )}

        {/* PIN Input */}
        {pinStatus?.status !== 'locked' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your 6-digit PIN
            </label>
            <div className="flex justify-center">
              <div className="flex space-x-2">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center text-2xl font-bold ${
                    pin.length === 6 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}>
                    {pin[index] ? '•' : ''}
                  </div>
                ))}
              </div>
            </div>
            <input
              type="password"
              value={pin}
              onChange={(e) => handlePinInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="opacity-0 absolute -z-10"
              maxLength={6}
              autoFocus
              disabled={verifying || pinStatus?.status === 'locked'}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <button
            onClick={onClose}
            disabled={verifying || loading}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          
          {pinStatus?.status !== 'locked' && (
            <button
              onClick={handleVerifyPin}
              disabled={verifying || loading || pin.length !== 6}
              className={`px-6 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                verifying || loading || pin.length !== 6
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {verifying || loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {loading ? 'Processing...' : 'Verifying...'}
                </div>
              ) : (
                'Confirm Transaction'
              )}
            </button>
          )}
        </div>

        {/* Security Note */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-xs text-blue-800 font-medium">Security Notice:</p>
              <p className="text-xs text-blue-700">
                Your PIN is required for all transactions. Never share your PIN with anyone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinVerification;