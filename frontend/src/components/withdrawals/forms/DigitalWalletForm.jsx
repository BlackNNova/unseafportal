import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DigitalWalletForm = ({ formData, onChange, errors }) => {
  const handleChange = (field, value) => {
    onChange({
      ...formData,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md mb-6">
        <p className="text-sm text-blue-800">
          <strong>Digital Wallet:</strong> Transfer to PayPal, Wise, Payoneer, or other digital wallets. Processing time: 3-5 business days. Fee: 1.5%
        </p>
      </div>

      {/* Wallet Provider */}
      <div className="banking-form-group">
        <Label htmlFor="walletProvider" className="banking-form-label required">
          Wallet Provider
        </Label>
        <Select
          value={formData.walletProvider || ''}
          onValueChange={(value) => handleChange('walletProvider', value)}
        >
          <SelectTrigger className={errors.walletProvider ? 'error' : ''}>
            <SelectValue placeholder="Select wallet provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paypal">PayPal</SelectItem>
            <SelectItem value="skrill">Skrill</SelectItem>
            <SelectItem value="wise">Wise (TransferWise)</SelectItem>
            <SelectItem value="payoneer">Payoneer</SelectItem>
            <SelectItem value="venmo">Venmo</SelectItem>
            <SelectItem value="cashapp">Cash App</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.walletProvider && (
          <p className="banking-form-error">{errors.walletProvider}</p>
        )}
      </div>

      {/* Wallet Email/Phone */}
      <div className="banking-form-group">
        <Label htmlFor="walletEmail" className="banking-form-label required">
          Wallet Email or Phone Number
        </Label>
        <Input
          id="walletEmail"
          type="text"
          value={formData.walletEmail || ''}
          onChange={(e) => handleChange('walletEmail', e.target.value)}
          placeholder="email@example.com or +1234567890"
          className={errors.walletEmail ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.walletEmail && (
          <p className="banking-form-error">{errors.walletEmail}</p>
        )}
        <p className="banking-form-help">
          The email or phone number associated with your wallet account
        </p>
      </div>

      {/* Wallet ID/Username */}
      <div className="banking-form-group">
        <Label htmlFor="walletId" className="banking-form-label">
          Wallet ID / Username (if applicable)
        </Label>
        <Input
          id="walletId"
          type="text"
          value={formData.walletId || ''}
          onChange={(e) => handleChange('walletId', e.target.value)}
          placeholder="Your wallet username or ID"
          className="banking-form-input"
        />
        <p className="banking-form-help">
          Some wallets use a unique ID or username instead of email
        </p>
      </div>

      {/* Verification Status */}
      <div className="banking-form-group">
        <Label htmlFor="verificationStatus" className="banking-form-label required">
          Account Verification Status
        </Label>
        <Select
          value={formData.verificationStatus || ''}
          onValueChange={(value) => handleChange('verificationStatus', value)}
        >
          <SelectTrigger className={errors.verificationStatus ? 'error' : ''}>
            <SelectValue placeholder="Select verification status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>
        {errors.verificationStatus && (
          <p className="banking-form-error">{errors.verificationStatus}</p>
        )}
        <p className="banking-form-help">
          Verified accounts typically receive funds faster
        </p>
      </div>

      {/* Currency */}
      <div className="banking-form-group">
        <Label htmlFor="currency" className="banking-form-label required">
          Preferred Currency
        </Label>
        <Select
          value={formData.currency || 'USD'}
          onValueChange={(value) => handleChange('currency', value)}
        >
          <SelectTrigger className={errors.currency ? 'error' : ''}>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD - US Dollar</SelectItem>
            <SelectItem value="EUR">EUR - Euro</SelectItem>
            <SelectItem value="GBP">GBP - British Pound</SelectItem>
            <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
            <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
            <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
          </SelectContent>
        </Select>
        {errors.currency && (
          <p className="banking-form-error">{errors.currency}</p>
        )}
        <p className="banking-form-help">
          Currency conversion rates may apply
        </p>
      </div>

      {/* Backup Email */}
      <div className="banking-form-group">
        <Label htmlFor="backupEmail" className="banking-form-label">
          Backup Email (Optional)
        </Label>
        <Input
          id="backupEmail"
          type="email"
          value={formData.backupEmail || ''}
          onChange={(e) => handleChange('backupEmail', e.target.value)}
          placeholder="backup@example.com"
          className="banking-form-input"
        />
        <p className="banking-form-help">
          Alternative email for notifications
        </p>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>Important:</strong> Ensure your wallet account is active and can receive funds. Some wallets have receiving limits that may affect large transfers.
        </p>
      </div>
    </div>
  );
};

export default DigitalWalletForm;
