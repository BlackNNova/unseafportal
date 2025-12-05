import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CheckForm = ({ formData, onChange, errors }) => {
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
          <strong>Physical Check:</strong> Check mailed to your registered address. Processing time: 3-5 business days. Fee: Flat $10
        </p>
      </div>

      {/* Payee Name */}
      <div className="banking-form-group">
        <Label htmlFor="payeeName" className="banking-form-label required">
          Payee Full Name
        </Label>
        <Input
          id="payeeName"
          type="text"
          value={formData.payeeName || ''}
          onChange={(e) => handleChange('payeeName', e.target.value)}
          placeholder="Full name as it should appear on the check"
          className={errors.payeeName ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.payeeName && (
          <p className="banking-form-error">{errors.payeeName}</p>
        )}
        <p className="banking-form-help">
          This name will be printed on the check
        </p>
      </div>

      {/* Address Line 1 */}
      <div className="banking-form-group">
        <Label htmlFor="addressLine1" className="banking-form-label required">
          Mailing Address Line 1
        </Label>
        <Input
          id="addressLine1"
          type="text"
          value={formData.addressLine1 || ''}
          onChange={(e) => handleChange('addressLine1', e.target.value)}
          placeholder="Street address, P.O. Box, company name, c/o"
          className={errors.addressLine1 ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.addressLine1 && (
          <p className="banking-form-error">{errors.addressLine1}</p>
        )}
      </div>

      {/* Address Line 2 */}
      <div className="banking-form-group">
        <Label htmlFor="addressLine2" className="banking-form-label">
          Mailing Address Line 2 (Optional)
        </Label>
        <Input
          id="addressLine2"
          type="text"
          value={formData.addressLine2 || ''}
          onChange={(e) => handleChange('addressLine2', e.target.value)}
          placeholder="Apartment, suite, unit, building, floor, etc."
          className="banking-form-input"
        />
      </div>

      {/* City */}
      <div className="banking-form-group">
        <Label htmlFor="city" className="banking-form-label required">
          City
        </Label>
        <Input
          id="city"
          type="text"
          value={formData.city || ''}
          onChange={(e) => handleChange('city', e.target.value)}
          placeholder="City name"
          className={errors.city ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.city && (
          <p className="banking-form-error">{errors.city}</p>
        )}
      </div>

      {/* State/Province */}
      <div className="banking-form-group">
        <Label htmlFor="state" className="banking-form-label required">
          State / Province
        </Label>
        <Input
          id="state"
          type="text"
          value={formData.state || ''}
          onChange={(e) => handleChange('state', e.target.value)}
          placeholder="State or Province"
          className={errors.state ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.state && (
          <p className="banking-form-error">{errors.state}</p>
        )}
      </div>

      {/* ZIP/Postal Code */}
      <div className="banking-form-group">
        <Label htmlFor="zipCode" className="banking-form-label required">
          ZIP / Postal Code
        </Label>
        <Input
          id="zipCode"
          type="text"
          value={formData.zipCode || ''}
          onChange={(e) => handleChange('zipCode', e.target.value)}
          placeholder="ZIP or Postal Code"
          className={errors.zipCode ? 'banking-form-input error' : 'banking-form-input'}
          required
        />
        {errors.zipCode && (
          <p className="banking-form-error">{errors.zipCode}</p>
        )}
      </div>

      {/* Country */}
      <div className="banking-form-group">
        <Label htmlFor="country" className="banking-form-label required">
          Country
        </Label>
        <Select
          value={formData.country || ''}
          onValueChange={(value) => handleChange('country', value)}
        >
          <SelectTrigger className={errors.country ? 'error' : ''}>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="United States">United States</SelectItem>
            <SelectItem value="Canada">Canada</SelectItem>
            <SelectItem value="United Kingdom">United Kingdom</SelectItem>
            <SelectItem value="Kenya">Kenya</SelectItem>
            <SelectItem value="South Africa">South Africa</SelectItem>
            <SelectItem value="Nigeria">Nigeria</SelectItem>
            <SelectItem value="Ghana">Ghana</SelectItem>
            <SelectItem value="Australia">Australia</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.country && (
          <p className="banking-form-error">{errors.country}</p>
        )}
      </div>

      {/* Delivery Instructions */}
      <div className="banking-form-group">
        <Label htmlFor="deliveryInstructions" className="banking-form-label">
          Special Delivery Instructions (Optional)
        </Label>
        <Textarea
          id="deliveryInstructions"
          value={formData.deliveryInstructions || ''}
          onChange={(e) => handleChange('deliveryInstructions', e.target.value)}
          placeholder="Any special delivery instructions (e.g., gate code, building access, etc.)"
          rows={3}
          className="banking-form-input"
        />
        <p className="banking-form-help">
          Help ensure successful delivery with specific instructions
        </p>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>Delivery Time:</strong> Checks are sent via standard mail and typically arrive within 3-5 business days after processing. International deliveries may take longer.
        </p>
      </div>

      <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Security Note:</strong> Checks are sent in secure envelopes. Please verify the address is correct to avoid delivery issues.
        </p>
      </div>
    </div>
  );
};

export default CheckForm;
