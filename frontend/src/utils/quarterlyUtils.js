// Quarterly Limit Calculation Engine
// Calculates quarters from grant start date and tracks usage

/**
 * Calculate which quarter the current date falls into based on grant start date
 * @param {string|Date} grantStartDate - The grant start date
 * @returns {Object} Current quarter information
 */
export const calculateCurrentQuarter = (grantStartDate) => {
  const startDate = new Date(grantStartDate);
  const currentDate = new Date();
  
  // Calculate months since grant start
  const monthsSinceStart = 
    (currentDate.getFullYear() - startDate.getFullYear()) * 12 +
    (currentDate.getMonth() - startDate.getMonth());
  
  // Determine current quarter (0-based)
  let quarterIndex = Math.floor(monthsSinceStart / 3);
  
  // Cap at Q4 (index 3)
  if (quarterIndex > 3) quarterIndex = 3;
  
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const currentQuarter = quarters[quarterIndex];
  
  // Calculate quarter date ranges
  const quarterStartMonth = quarterIndex * 3;
  const quarterEndMonth = quarterStartMonth + 3;
  
  const quarterStartDate = new Date(startDate);
  quarterStartDate.setMonth(startDate.getMonth() + quarterStartMonth);
  
  const quarterEndDate = new Date(startDate);
  quarterEndDate.setMonth(startDate.getMonth() + quarterEndMonth);
  quarterEndDate.setDate(quarterEndDate.getDate() - 1); // Last day of quarter
  
  // Format for display
  const year = startDate.getFullYear() + Math.floor((startDate.getMonth() + quarterStartMonth) / 12);
  const quarterPeriod = `${currentQuarter}-${year}`;
  
  return {
    quarter: currentQuarter,
    quarterIndex,
    quarterPeriod,
    startDate: quarterStartDate,
    endDate: quarterEndDate,
    isActive: currentDate >= quarterStartDate && currentDate <= quarterEndDate,
    daysRemaining: Math.max(0, Math.ceil((quarterEndDate - currentDate) / (1000 * 60 * 60 * 24)))
  };
};

/**
 * Calculate quarterly limits and usage
 * @param {Object} grantData - User grant data from database
 * @returns {Object} Quarterly limit information
 */
export const calculateQuarterlyLimits = (grantData) => {
  if (!grantData) {
    return null;
  }
  
  const {
    total_grant_amount,
    grant_start_date,
    current_balance,
    q1_used = 0,
    q2_used = 0,
    q3_used = 0,
    q4_used = 0
  } = grantData;
  
  // Calculate current quarter
  const currentQuarterInfo = calculateCurrentQuarter(grant_start_date);
  const { quarter, quarterPeriod } = currentQuarterInfo;
  
  // Calculate quarter limits (Q1-Q3: 33.33% each, Q4: remaining)
  const quarterLimit = total_grant_amount * 0.3333;
  
  // Get usage for current quarter
  const quarterUsageMap = {
    Q1: q1_used,
    Q2: q2_used,
    Q3: q3_used,
    Q4: q4_used
  };
  
  const currentQuarterUsed = quarterUsageMap[quarter] || 0;
  
  // Calculate remaining for current quarter
  let currentQuarterRemaining;
  if (quarter === 'Q4') {
    // Q4 gets whatever is left
    currentQuarterRemaining = current_balance;
  } else {
    // Q1-Q3 have fixed limits
    currentQuarterRemaining = Math.max(0, quarterLimit - currentQuarterUsed);
  }
  
  // Calculate total used across all quarters
  const totalUsed = q1_used + q2_used + q3_used + q4_used;
  
  // Calculate percentage used in current quarter
  const currentQuarterLimit = quarter === 'Q4' ? current_balance : quarterLimit;
  const percentageUsed = currentQuarterLimit > 0 
    ? (currentQuarterUsed / currentQuarterLimit) * 100 
    : 0;
  
  return {
    // Current quarter info
    currentQuarter: quarter,
    currentQuarterPeriod: quarterPeriod,
    currentQuarterLimit: currentQuarterLimit,
    currentQuarterUsed: currentQuarterUsed,
    currentQuarterRemaining: currentQuarterRemaining,
    currentQuarterPercentageUsed: percentageUsed,
    
    // Date info
    quarterStartDate: currentQuarterInfo.startDate,
    quarterEndDate: currentQuarterInfo.endDate,
    daysRemainingInQuarter: currentQuarterInfo.daysRemaining,
    
    // Overall grant info
    totalGrantAmount: total_grant_amount,
    totalUsed: totalUsed,
    currentBalance: current_balance,
    
    // All quarters usage
    quarters: {
      Q1: { limit: quarterLimit, used: q1_used, remaining: Math.max(0, quarterLimit - q1_used) },
      Q2: { limit: quarterLimit, used: q2_used, remaining: Math.max(0, quarterLimit - q2_used) },
      Q3: { limit: quarterLimit, used: q3_used, remaining: Math.max(0, quarterLimit - q3_used) },
      Q4: { limit: 'Remaining Balance', used: q4_used, remaining: current_balance }
    },
    
    // Status indicators
    isQuarterLimitReached: currentQuarterRemaining <= 0,
    isNearQuarterLimit: currentQuarterRemaining > 0 && percentageUsed >= 80,
    canWithdraw: currentQuarterRemaining > 0 && current_balance > 0
  };
};

/**
 * Validate if a withdrawal amount is within quarterly limits
 * @param {number} amount - Withdrawal amount to validate
 * @param {Object} quarterlyLimits - Quarterly limits from calculateQuarterlyLimits
 * @returns {Object} Validation result
 */
export const validateWithdrawalAmount = (amount, quarterlyLimits) => {
  if (!quarterlyLimits) {
    return {
      isValid: false,
      error: 'Grant information not available'
    };
  }
  
  const { currentQuarterRemaining, currentBalance, currentQuarter } = quarterlyLimits;
  
  // Check if amount is positive
  if (amount <= 0) {
    return {
      isValid: false,
      error: 'Withdrawal amount must be greater than zero'
    };
  }
  
  // Check if amount exceeds current balance
  if (amount > currentBalance) {
    return {
      isValid: false,
      error: `Insufficient balance. Available: $${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    };
  }
  
  // Check if amount exceeds quarterly limit
  if (amount > currentQuarterRemaining) {
    return {
      isValid: false,
      error: `Exceeds ${currentQuarter} limit. Available this quarter: $${currentQuarterRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    };
  }
  
  // All validations passed
  return {
    isValid: true,
    message: 'Withdrawal amount is valid'
  };
};

/**
 * Calculate withdrawal fee based on method
 * @param {number} amount - Withdrawal amount
 * @param {string} method - Withdrawal method
 * @returns {Object} Fee calculation
 */
export const calculateWithdrawalFee = (amount, method) => {
  let fee = 0;
  let feePercentage = 0;
  let flatFee = 0;
  
  switch (method) {
    case 'bank_transfer':
      feePercentage = 0.02; // 2%
      fee = Math.max(amount * feePercentage, 5); // Minimum $5
      break;
      
    case 'wire_transfer':
      feePercentage = 0.03; // 3%
      flatFee = 25; // $25 flat fee
      fee = flatFee + (amount * feePercentage);
      break;
      
    case 'digital_wallet':
      feePercentage = 0.015; // 1.5%
      fee = amount * feePercentage;
      break;
      
    case 'check':
      flatFee = 10; // $10 flat fee
      fee = flatFee;
      break;
      
    default:
      fee = 0;
  }
  
  const netAmount = amount - fee;
  
  return {
    amount,
    fee,
    netAmount,
    feePercentage: feePercentage * 100, // Convert to percentage
    flatFee,
    method
  };
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Calculate expected completion date (3-5 business days)
 * @param {Date} startDate - Start date (default: now)
 * @returns {Date} Expected completion date
 */
export const calculateExpectedCompletion = (startDate = new Date()) => {
  const date = new Date(startDate);
  let businessDaysToAdd = 5; // 5 business days
  
  while (businessDaysToAdd > 0) {
    date.setDate(date.getDate() + 1);
    // Skip weekends
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      businessDaysToAdd--;
    }
  }
  
  return date;
};

/**
 * Get processing timeline for withdrawal
 * @returns {Array} Timeline steps
 */
export const getProcessingTimeline = () => {
  return [
    {
      step: 'submitted',
      label: 'Request Submitted',
      description: 'Your withdrawal request has been received',
      icon: 'CheckCircle'
    },
    {
      step: 'processing',
      label: 'Processing',
      description: 'Being verified by financial institution',
      icon: 'Clock'
    },
    {
      step: 'completed',
      label: 'Completed',
      description: 'Funds successfully transferred',
      icon: 'CheckCircle'
    }
  ];
};

export default {
  calculateCurrentQuarter,
  calculateQuarterlyLimits,
  validateWithdrawalAmount,
  calculateWithdrawalFee,
  formatCurrency,
  calculateExpectedCompletion,
  getProcessingTimeline
};
