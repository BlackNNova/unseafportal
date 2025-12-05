/**
 * PIN Setup Modal Component
 * First-time transaction PIN setup for users
 * Triggered when user attempts first withdrawal/payment
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { createUserPin, validatePinFormat, PIN_RULES } from '../utils/pinUtils';

const PinSetup = ({ isOpen, onClose, onSuccess, userName = '' }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Enter PIN, 2: Confirm PIN, 3: Success

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setConfirmPin('');
      setError('');
      setStep(1);
    }
  }, [isOpen]);

  const handlePinInput = (value, isConfirm = false) => {
    // Only allow digits, max 6 characters
    const cleanedValue = value.replace(/\D/g, '').slice(0, PIN_RULES.length);
    
    if (isConfirm) {
      setConfirmPin(cleanedValue);
    } else {
      setPin(cleanedValue);
      setError(''); // Clear errors when typing
    }
  };

  const handleNextStep = () => {
    setError('');
    
    if (step === 1) {
      // Validate PIN format
      const validation = validatePinFormat(pin);
      if (!validation.isValid) {
        setError(validation.error);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Check if PINs match
      if (pin !== confirmPin) {
        setError('PINs do not match. Please try again.');
        return;
      }
      handleCreatePin();
    }
  };

  const handleCreatePin = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to set up your PIN');
        setLoading(false);
        return;
      }

      const result = await createUserPin(user.id, pin);
      
      if (result.success) {
        setStep(3);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('PIN setup error:', error);
      setError('An unexpected error occurred. Please try again.');
    }

    setLoading(false);
  };

  const handleBackStep = () => {
    setError('');
    if (step === 2) {
      setStep(1);
      setConfirmPin('');
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
            Transaction PIN Setup
          </h2>
          <p className="text-gray-600">
            {step === 1 && 'Create a secure 6-digit PIN for transactions'}
            {step === 2 && 'Confirm your PIN to complete setup'}
            {step === 3 && 'PIN setup completed successfully!'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
            <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              ✓
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          
          {/* Step 1: Enter PIN */}
          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Create your 6-digit PIN
              </label>
              <div className="flex justify-center relative">
                <div className="flex space-x-2">
                  {[...Array(6)].map((_, index) => (
                    <div 
                      key={index} 
                      className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center text-2xl font-bold cursor-text hover:border-blue-400 focus-within:border-blue-500"
                      onClick={() => document.getElementById('pin-input-1').focus()}
                    >
                      {pin[index] ? '•' : ''}
                    </div>
                  ))}
                </div>
                <input
                  id="pin-input-1"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={(e) => handlePinInput(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text"
                  maxLength={6}
                  autoFocus
                  style={{ zIndex: 10 }}
                />
              </div>
              
              {/* PIN Requirements */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">PIN Requirements:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Must be exactly 6 digits</li>
                  <li>• No repeated digits (e.g., 111111)</li>
                  <li>• No sequential patterns (e.g., 123456)</li>
                  <li>• Choose a PIN you can remember securely</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Confirm PIN */}
          {step === 2 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm your PIN
              </label>
              <div className="flex justify-center relative">
                <div className="flex space-x-2">
                  {[...Array(6)].map((_, index) => (
                    <div 
                      key={index} 
                      className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center text-2xl font-bold cursor-text hover:border-blue-400 focus-within:border-blue-500"
                      onClick={() => document.getElementById('pin-input-2').focus()}
                    >
                      {confirmPin[index] ? '•' : ''}
                    </div>
                  ))}
                </div>
                <input
                  id="pin-input-2"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={confirmPin}
                  onChange={(e) => handlePinInput(e.target.value, true)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text"
                  maxLength={6}
                  autoFocus
                  style={{ zIndex: 10 }}
                />
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-800 font-medium">
                Your transaction PIN has been set up successfully!
              </p>
              <p className="text-sm text-gray-600 mt-2">
                You can now proceed with secure transactions.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
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
            {step === 2 && (
              <button
                onClick={handleBackStep}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
            )}
            
            {step < 3 && (
              <button
                onClick={handleNextStep}
                disabled={loading || (step === 1 && pin.length !== 6) || (step === 2 && confirmPin.length !== 6)}
                className={`ml-auto px-6 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading || (step === 1 && pin.length !== 6) || (step === 2 && confirmPin.length !== 6)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting up...
                  </div>
                ) : (
                  step === 1 ? 'Continue' : 'Complete Setup'
                )}
              </button>
            )}

            {step === 1 && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinSetup;