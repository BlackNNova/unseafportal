import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const WireTransferForm = ({ formData, onChange, errors }) => {
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
          <strong>Wire Transfer:</strong> International SWIFT/BIC transfer. Processing time: 3-5 business days. Fee: $25 + 3%
        </p>
      </div>

      {/* All Bank Transfer Fields */}
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

      <div className="banking-form-group">
        <Label htmlFor="bankName" className="banking-form-label required">
          Bank Name
        </Label>
        <Input
          id="bankName"
          type="text"
          value={formData.bankName || ''}
          onChange={(e) => handleChange('bankName', e.target.value)}
          placeholder="Full bank name"
          className={errors.bankName ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.bankName && (
          <p className="banking-form-error">{errors.bankName}</p>
        )}
      </div>

      <div className="banking-form-group">
        <Label htmlFor="accountNumber" className="banking-form-label required">
          Account Number / IBAN
        </Label>
        <Input
          id="accountNumber"
          type="text"
          value={formData.accountNumber || ''}
          onChange={(e) => handleChange('accountNumber', e.target.value)}
          placeholder="Account number or IBAN"
          className={errors.accountNumber ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.accountNumber && (
          <p className="banking-form-error">{errors.accountNumber}</p>
        )}
      </div>

      <div className="banking-form-group">
        <Label htmlFor="routingNumber" className="banking-form-label required">
          Routing Number / Sort Code
        </Label>
        <Input
          id="routingNumber"
          type="text"
          value={formData.routingNumber || ''}
          onChange={(e) => handleChange('routingNumber', e.target.value)}
          placeholder="Routing number or sort code"
          className={errors.routingNumber ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.routingNumber && (
          <p className="banking-form-error">{errors.routingNumber}</p>
        )}
      </div>

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

      {/* Wire Transfer Specific Fields */}
      <div className="mt-8 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Wire Transfer Details</h3>
        <p className="text-sm text-gray-600">Additional information required for international transfers</p>
      </div>

      <div className="banking-form-group">
        <Label htmlFor="swiftCode" className="banking-form-label required">
          SWIFT/BIC Code
        </Label>
        <Input
          id="swiftCode"
          type="text"
          value={formData.swiftCode || ''}
          onChange={(e) => handleChange('swiftCode', e.target.value.toUpperCase())}
          placeholder="e.g., CHASUS33"
          maxLength={11}
          className={errors.swiftCode ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.swiftCode && (
          <p className="banking-form-error">{errors.swiftCode}</p>
        )}
        <p className="banking-form-help">
          8 or 11 character code identifying your bank internationally
        </p>
      </div>

      <div className="banking-form-group">
        <Label htmlFor="intermediaryBank" className="banking-form-label">
          Intermediary Bank Name (if applicable)
        </Label>
        <Input
          id="intermediaryBank"
          type="text"
          value={formData.intermediaryBank || ''}
          onChange={(e) => handleChange('intermediaryBank', e.target.value)}
          placeholder="Intermediary bank name"
          className="banking-form-input"
        />
        <p className="banking-form-help">
          Required for some international transfers
        </p>
      </div>

      <div className="banking-form-group">
        <Label htmlFor="intermediarySwift" className="banking-form-label">
          Intermediary Bank SWIFT (if applicable)
        </Label>
        <Input
          id="intermediarySwift"
          type="text"
          value={formData.intermediarySwift || ''}
          onChange={(e) => handleChange('intermediarySwift', e.target.value.toUpperCase())}
          placeholder="Intermediary SWIFT code"
          maxLength={11}
          className="banking-form-input"
        />
      </div>

      <div className="banking-form-group">
        <Label htmlFor="bankAddress" className="banking-form-label required">
          Bank Address
        </Label>
        <Textarea
          id="bankAddress"
          value={formData.bankAddress || ''}
          onChange={(e) => handleChange('bankAddress', e.target.value)}
          placeholder="Full bank address"
          rows={3}
          className={errors.bankAddress ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.bankAddress && (
          <p className="banking-form-error">{errors.bankAddress}</p>
        )}
      </div>

      <div className="banking-form-group">
        <Label htmlFor="beneficiaryAddress" className="banking-form-label required">
          Beneficiary Address
        </Label>
        <Textarea
          id="beneficiaryAddress"
          value={formData.beneficiaryAddress || ''}
          onChange={(e) => handleChange('beneficiaryAddress', e.target.value)}
          placeholder="Your full address"
          rows={3}
          className={errors.beneficiaryAddress ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.beneficiaryAddress && (
          <p className="banking-form-error">{errors.beneficiaryAddress}</p>
        )}
      </div>

      <div className="banking-form-group">
        <Label htmlFor="wireInstructions" className="banking-form-label required">
          Wire Instructions / Purpose
        </Label>
        <Textarea
          id="wireInstructions"
          value={formData.wireInstructions || ''}
          onChange={(e) => handleChange('wireInstructions', e.target.value)}
          placeholder="Purpose of wire transfer and any special instructions"
          rows={3}
          className={errors.wireInstructions ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.wireInstructions && (
          <p className="banking-form-error">{errors.wireInstructions}</p>
        )}
        <p className="banking-form-help">
          Describe the purpose of this transfer (e.g., "Grant disbursement for project expenses")
        </p>
      </div>

      <div className="banking-form-group">
        <Label htmlFor="beneficiaryPhone" className="banking-form-label required">
          Beneficiary Phone Number
        </Label>
        <Input
          id="beneficiaryPhone"
          type="tel"
          value={formData.beneficiaryPhone || ''}
          onChange={(e) => handleChange('beneficiaryPhone', e.target.value)}
          placeholder="+1 (555) 123-4567"
          className={errors.beneficiaryPhone ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.beneficiaryPhone && (
          <p className="banking-form-error">{errors.beneficiaryPhone}</p>
        )}
        <p className="banking-form-help">
          Include country code for international numbers
        </p>
      </div>

      <div className="banking-form-group">
        <Label htmlFor="referenceNote" className="banking-form-label">
          Reference Note (Optional)
        </Label>
        <Input
          id="referenceNote"
          type="text"
          value={formData.referenceNote || ''}
          onChange={(e) => handleChange('referenceNote', e.target.value)}
          placeholder="Additional reference information"
          className="banking-form-input"
        />
      </div>
    </div>
  );
};

export default WireTransferForm;
