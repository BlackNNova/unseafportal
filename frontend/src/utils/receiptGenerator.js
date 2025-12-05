// Receipt Generation Utility
// Generates professional HTML receipts for withdrawals

import { formatCurrency } from './quarterlyUtils';

/**
 * Generate HTML receipt for a withdrawal
 * @param {Object} withdrawal - Withdrawal data from database
 * @param {Object} userData - User data
 * @param {Object} grantData - Grant data
 * @returns {string} HTML receipt
 */
export const generateWithdrawalReceipt = (withdrawal, userData, grantData) => {
  const {
    transaction_number,
    amount,
    fee,
    net_amount,
    method,
    method_details,
    status,
    quarter_period,
    quarter_limit,
    quarter_used_before,
    quarter_remaining_after,
    created_at,
    expected_completion_date
  } = withdrawal;

  // Format dates
  const createdDate = new Date(created_at);
  const expectedDate = expected_completion_date ? new Date(expected_completion_date) : null;
  
  const formattedDateTime = createdDate.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formattedExpected = expectedDate ? expectedDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }) : 'Processing';

  // Method display names
  const methodNames = {
    bank_transfer: 'Bank Transfer',
    wire_transfer: 'Wire Transfer',
    digital_wallet: 'Digital Wallet',
    check: 'Physical Check'
  };

  // Status display
  const statusClasses = {
    pending: 'status-pending',
    processing: 'status-processing',
    completed: 'status-completed',
    failed: 'status-failed'
  };

  const statusTexts = {
    pending: 'PENDING',
    processing: 'PROCESSING',
    completed: 'COMPLETED',
    failed: 'FAILED'
  };

  // Generate method details HTML
  const getMethodDetailsHTML = () => {
    let html = '';
    
    if (method === 'bank_transfer' || method === 'wire_transfer') {
      html += `
        <div class="info-label">Account Holder:</div>
        <div class="info-value">${method_details.accountHolderName || 'N/A'}</div>
        
        <div class="info-label">Bank Name:</div>
        <div class="info-value">${method_details.bankName || 'N/A'}</div>
        
        <div class="info-label">Account Number:</div>
        <div class="info-value">****${(method_details.accountNumber || '').slice(-4)}</div>
        
        <div class="info-label">Account Type:</div>
        <div class="info-value">${method_details.accountType || 'N/A'}</div>
      `;
      
      if (method === 'wire_transfer' && method_details.swiftCode) {
        html += `
          <div class="info-label">SWIFT Code:</div>
          <div class="info-value">${method_details.swiftCode}</div>
        `;
      }
    } else if (method === 'digital_wallet') {
      html += `
        <div class="info-label">Wallet Provider:</div>
        <div class="info-value">${method_details.walletProvider || 'N/A'}</div>
        
        <div class="info-label">Wallet Email/Phone:</div>
        <div class="info-value">${method_details.walletEmail || 'N/A'}</div>
        
        <div class="info-label">Currency:</div>
        <div class="info-value">${method_details.currency || 'USD'}</div>
      `;
    } else if (method === 'check') {
      html += `
        <div class="info-label">Payee Name:</div>
        <div class="info-value">${method_details.payeeName || 'N/A'}</div>
        
        <div class="info-label">Mailing Address:</div>
        <div class="info-value">${method_details.addressLine1 || ''}, ${method_details.city || ''}, ${method_details.state || ''} ${method_details.zipCode || ''}</div>
        
        <div class="info-label">Country:</div>
        <div class="info-value">${method_details.country || 'N/A'}</div>
      `;
    }
    
    return html;
  };

  // Quarter date range
  const quarterDates = `${quarter_period}`;
  
  // User full name
  const userName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Withdrawal Receipt - ${transaction_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: #f4f5f7; }
    
    .receipt-container {
      max-width: 800px;
      margin: 40px auto;
      background: white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .receipt-header {
      background: linear-gradient(135deg, #0052CC 0%, #003D99 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .receipt-header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .receipt-header p {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .receipt-number {
      background: rgba(255,255,255,0.2);
      display: inline-block;
      padding: 8px 16px;
      border-radius: 4px;
      margin-top: 16px;
      font-size: 16px;
      font-weight: 600;
    }
    
    .receipt-body {
      padding: 40px;
    }
    
    .section {
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid #DFE1E6;
    }
    
    .section:last-child {
      border-bottom: none;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #172B4D;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 12px;
    }
    
    .info-label {
      font-size: 14px;
      color: #5E6C84;
      font-weight: 500;
    }
    
    .info-value {
      font-size: 14px;
      color: #172B4D;
      font-weight: 400;
    }
    
    .amount-highlight {
      background: #E6F0FF;
      border-left: 4px solid #0052CC;
      padding: 24px;
      margin: 24px 0;
      border-radius: 4px;
    }
    
    .amount-highlight .label {
      font-size: 14px;
      color: #5E6C84;
      margin-bottom: 8px;
    }
    
    .amount-highlight .amount {
      font-size: 36px;
      font-weight: 700;
      color: #0052CC;
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status-pending { background: #FF8B00; color: white; }
    .status-processing { background: #0052CC; color: white; }
    .status-completed { background: #00875A; color: white; }
    .status-failed { background: #DE350B; color: white; }
    
    .timeline {
      margin-top: 24px;
    }
    
    .timeline-step {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
      position: relative;
      padding-left: 32px;
    }
    
    .timeline-step::before {
      content: '';
      position: absolute;
      left: 7px;
      top: 24px;
      width: 2px;
      height: calc(100% + 16px);
      background: #DFE1E6;
    }
    
    .timeline-step:last-child::before {
      display: none;
    }
    
    .timeline-icon {
      position: absolute;
      left: 0;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #00875A;
      border: 2px solid white;
      box-shadow: 0 0 0 2px #00875A;
    }
    
    .timeline-icon.pending {
      background: #DFE1E6;
      box-shadow: 0 0 0 2px #DFE1E6;
    }
    
    .timeline-content {
      flex: 1;
    }
    
    .timeline-title {
      font-size: 14px;
      font-weight: 600;
      color: #172B4D;
      margin-bottom: 4px;
    }
    
    .timeline-date {
      font-size: 12px;
      color: #5E6C84;
    }
    
    .receipt-footer {
      background: #F4F5F7;
      padding: 32px;
      text-align: center;
      border-top: 1px solid #DFE1E6;
    }
    
    .receipt-footer p {
      font-size: 12px;
      color: #5E6C84;
      margin-bottom: 8px;
    }
    
    .footer-links {
      margin-top: 16px;
    }
    
    .footer-links a {
      color: #0052CC;
      text-decoration: none;
      margin: 0 12px;
      font-size: 12px;
    }
    
    @media print {
      body { background: white; }
      .receipt-container { box-shadow: none; margin: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- Header -->
    <div class="receipt-header">
      <h1>UNSEAF GRANT PORTAL</h1>
      <p>United Nations Sustainable Enterprise Acceleration Fund</p>
      <div class="receipt-number">
        Transaction Receipt: ${transaction_number}
      </div>
    </div>
    
    <!-- Body -->
    <div class="receipt-body">
      <!-- Transaction Summary -->
      <div class="section">
        <div class="section-title">Transaction Summary</div>
        
        <div class="info-grid">
          <div class="info-label">Transaction Type:</div>
          <div class="info-value">Withdrawal Request</div>
          
          <div class="info-label">Transaction Number:</div>
          <div class="info-value">${transaction_number}</div>
          
          <div class="info-label">Date & Time:</div>
          <div class="info-value">${formattedDateTime}</div>
          
          <div class="info-label">Status:</div>
          <div class="info-value">
            <span class="status-badge ${statusClasses[status]}">${statusTexts[status]}</span>
          </div>
        </div>
      </div>
      
      <!-- Amount Details -->
      <div class="section">
        <div class="section-title">Amount Details</div>
        
        <div class="amount-highlight">
          <div class="label">Withdrawal Amount</div>
          <div class="amount">${formatCurrency(amount)}</div>
        </div>
        
        <div class="info-grid">
          <div class="info-label">Processing Fee:</div>
          <div class="info-value">${formatCurrency(fee)}</div>
          
          <div class="info-label">Net Amount:</div>
          <div class="info-value" style="font-weight: 600; font-size: 16px;">${formatCurrency(net_amount)}</div>
        </div>
      </div>
      
      <!-- Beneficiary Information -->
      <div class="section">
        <div class="section-title">Beneficiary Information</div>
        
        <div class="info-grid">
          <div class="info-label">Grant ID:</div>
          <div class="info-value">${grantData?.id || 'N/A'}</div>
          
          <div class="info-label">Beneficiary Name:</div>
          <div class="info-value">${userName}</div>
          
          <div class="info-label">Project:</div>
          <div class="info-value">${grantData?.grant_title || 'N/A'}</div>
          
          <div class="info-label">UNSEAF Account:</div>
          <div class="info-value">${userData.email}</div>
        </div>
      </div>
      
      <!-- Withdrawal Method Details -->
      <div class="section">
        <div class="section-title">Withdrawal Method</div>
        
        <div class="info-grid">
          <div class="info-label">Method:</div>
          <div class="info-value">${methodNames[method]}</div>
          
          <div class="info-label">Processing Time:</div>
          <div class="info-value">3-5 Business Days</div>
          
          ${getMethodDetailsHTML()}
        </div>
      </div>
      
      <!-- Quarterly Status -->
      <div class="section">
        <div class="section-title">Quarterly Status</div>
        
        <div class="info-grid">
          <div class="info-label">Current Quarter:</div>
          <div class="info-value">${quarterDates}</div>
          
          <div class="info-label">Quarter Limit:</div>
          <div class="info-value">${formatCurrency(quarter_limit)}</div>
          
          <div class="info-label">Used Before This:</div>
          <div class="info-value">${formatCurrency(quarter_used_before)}</div>
          
          <div class="info-label">Remaining After:</div>
          <div class="info-value" style="font-weight: 600; color: #00875A;">${formatCurrency(quarter_remaining_after)}</div>
        </div>
      </div>
      
      <!-- Processing Timeline -->
      <div class="section">
        <div class="section-title">Processing Timeline</div>
        
        <div class="timeline">
          <div class="timeline-step">
            <div class="timeline-icon"></div>
            <div class="timeline-content">
              <div class="timeline-title">Request Submitted</div>
              <div class="timeline-date">${formattedDateTime}</div>
            </div>
          </div>
          
          <div class="timeline-step">
            <div class="timeline-icon ${status === 'processing' || status === 'completed' ? '' : 'pending'}"></div>
            <div class="timeline-content">
              <div class="timeline-title">Processing</div>
              <div class="timeline-date">${status === 'processing' || status === 'completed' ? 'In Progress' : 'Pending'}</div>
            </div>
          </div>
          
          <div class="timeline-step">
            <div class="timeline-icon ${status === 'completed' ? '' : 'pending'}"></div>
            <div class="timeline-content">
              <div class="timeline-title">Completed</div>
              <div class="timeline-date">Expected: ${formattedExpected}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="receipt-footer">
      <p>This is a computer-generated receipt and does not require a signature.</p>
      <p>Transaction processed securely through UNSEAF Grant Portal</p>
      <div class="footer-links">
        <a href="mailto:support@unseaf.org">support@unseaf.org</a>
        <a href="https://funding-unseaf.org">funding-unseaf.org</a>
        <a href="tel:+1-800-UNSEAF">+1-800-UNSEAF</a>
      </div>
      <p style="margin-top: 16px; font-size: 10px;">
        © 2025 United Nations Sustainable Enterprise Acceleration Fund. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
};

export default {
  generateWithdrawalReceipt
};
