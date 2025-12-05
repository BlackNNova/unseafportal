import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BankTransferForm = ({ formData, onChange, errors }) => {
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
          <strong>Bank Transfer:</strong> Direct ACH transfer to your bank account. Processing time: 3-5 business days. Fee: 2% (minimum $5)
        </p>
      </div>

      {/* Account Holder Name */}
      <div className="banking-form-group">
        <Label htmlFor="accountHolderName" className="banking-form-label required">
          Account Holder Name
        </Label>
        <Input
          id="accountHolderName"
          type="text"
          value={formData.accountHolderName || ''}
          onChange={(e) => handleChange('accountHolderName', e.target.value)}
          placeholder="Full name as it appears on bank account"
          className={errors.accountHolderName ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.accountHolderName && (
          <p className="banking-form-error">{errors.accountHolderName}</p>
        )}
      </div>

      {/* Bank Name */}
      <div className="banking-form-group">
        <Label htmlFor="bankName" className="banking-form-label required">
          Bank Name
        </Label>
        <Input
          id="bankName"
          type="text"
          value={formData.bankName || ''}
          onChange={(e) => handleChange('bankName', e.target.value)}
          placeholder="e.g., Chase Bank, Bank of America"
          className={errors.bankName ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.bankName && (
          <p className="banking-form-error">{errors.bankName}</p>
        )}
      </div>

      {/* Account Number */}
      <div className="banking-form-group">
        <Label htmlFor="accountNumber" className="banking-form-label required">
          Account Number
        </Label>
        <Input
          id="accountNumber"
          type="text"
          value={formData.accountNumber || ''}
          onChange={(e) => handleChange('accountNumber', e.target.value)}
          placeholder="Your bank account number"
          className={errors.accountNumber ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.accountNumber && (
          <p className="banking-form-error">{errors.accountNumber}</p>
        )}
        <p className="banking-form-help">
          This information is encrypted and securely stored
        </p>
      </div>

      {/* Routing Number */}
      <div className="banking-form-group">
        <Label htmlFor="routingNumber" className="banking-form-label required">
          Routing Number
        </Label>
        <Input
          id="routingNumber"
          type="text"
          value={formData.routingNumber || ''}
          onChange={(e) => handleChange('routingNumber', e.target.value)}
          placeholder="9-digit routing number"
          maxLength={9}
          className={errors.routingNumber ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.routingNumber && (
          <p className="banking-form-error">{errors.routingNumber}</p>
        )}
        <p className="banking-form-help">
          Found on the bottom of your checks or bank statement
        </p>
      </div>

      {/* Account Type */}
      <div className="banking-form-group">
        <Label htmlFor="accountType" className="banking-form-label required">
          Account Type
        </Label>
        <Select
          value={formData.accountType || ''}
          onValueChange={(value) => handleChange('accountType', value)}
        >
          <SelectTrigger className={errors.accountType ? 'error' : ''}>
            <SelectValue placeholder="Select account type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="checking">Checking Account</SelectItem>
            <SelectItem value="savings">Savings Account</SelectItem>
          </SelectContent>
        </Select>
        {errors.accountType && (
          <p className="banking-form-error">{errors.accountType}</p>
        )}
      </div>

      {/* Bank Address */}
      <div className="banking-form-group">
        <Label htmlFor="bankAddress" className="banking-form-label required">
          Bank Address
        </Label>
        <Textarea
          id="bankAddress"
          value={formData.bankAddress || ''}
          onChange={(e) => handleChange('bankAddress', e.target.value)}
          placeholder="Full bank address including street, city, state, and ZIP code"
          rows={3}
          className={errors.bankAddress ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.bankAddress && (
          <p className="banking-form-error">{errors.bankAddress}</p>
        )}
      </div>

      {/* Beneficiary Address */}
      <div className="banking-form-group">
        <Label htmlFor="beneficiaryAddress" className="banking-form-label required">
          Beneficiary Address
        </Label>
        <Textarea
          id="beneficiaryAddress"
          value={formData.beneficiaryAddress || ''}
          onChange={(e) => handleChange('beneficiaryAddress', e.target.value)}
          placeholder="Your full address including street, city, state, and ZIP code"
          rows={3}
          className={errors.beneficiaryAddress ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.beneficiaryAddress && (
          <p className="banking-form-error">{errors.beneficiaryAddress}</p>
        )}
      </div>

      {/* Reference Note (Optional) */}
      <div className="banking-form-group">
        <Label htmlFor="referenceNote" className="banking-form-label">
          Reference Note (Optional)
        </Label>
        <Input
          id="referenceNote"
          type="text"
          value={formData.referenceNote || ''}
          onChange={(e) => handleChange('referenceNote', e.target.value)}
          placeholder="Any additional notes or reference information"
          className="banking-form-input"
        />
        <p className="banking-form-help">
          This will appear on your bank statement
        </p>
      </div>
    </div>
  );
};

export default BankTransferForm;
