import React from 'react';
import { CreditCard, Zap, Wallet, FileText } from 'lucide-react';
import '../../styles/banking.css';

const WithdrawalMethodSelector = ({ selectedMethod, onMethodSelect }) => {
  const methods = [
    {
      id: 'bank_transfer',
      icon: CreditCard,
      title: 'Bank Transfer',
      description: 'Direct transfer to your bank account',
      processingTime: '3-5 business days',
      fee: '2% (minimum $5)',
      details: 'Secure ACH transfer to your checking or savings account'
    },
    {
      id: 'wire_transfer',
      icon: Zap,
      title: 'Wire Transfer',
      description: 'Fast international wire transfer',
      processingTime: '3-5 business days',
      fee: '$25 + 3%',
      details: 'SWIFT/BIC transfer for international payments'
    },
    {
      id: 'digital_wallet',
      icon: Wallet,
      title: 'Digital Wallet',
      description: 'Transfer to PayPal, Wise, or other wallets',
      processingTime: '3-5 business days',
      fee: '1.5%',
      details: 'Quick transfer to your preferred digital wallet'
    },
    {
      id: 'check',
      icon: FileText,
      title: 'Physical Check',
      description: 'Mailed check to your address',
      processingTime: '3-5 business days',
      fee: 'Flat $10',
      details: 'Traditional check mailed to your registered address'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Select Withdrawal Method
        </h2>
        <p className="text-gray-600">
          Choose how you'd like to receive your funds
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          
          return (
            <div
              key={method.id}
              className={`method-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onMethodSelect(method.id)}
            >
              <div className="method-card-icon">
                <Icon className="h-6 w-6" />
              </div>
              
              <h3 className="method-card-title">{method.title}</h3>
              
              <p className="method-card-description">
                {method.description}
              </p>
              
              <div className="method-card-details space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Processing:</span>
                  <span className="font-medium text-gray-700">{method.processingTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Fee:</span>
                  <span className="font-medium text-gray-700">{method.fee}</span>
                </div>
              </div>
              
              {isSelected && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    ✓ {method.details}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>All withdrawal methods now process within 3-5 business days.</strong> Fees vary by method. Please review the fee structure before proceeding.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalMethodSelector;
