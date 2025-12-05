/**
 * Currency formatting utility for Unseaf Portal
 * Formats numbers with proper comma separators and currency symbols
 */

/**
 * Format a number as currency with comma separators
 * @param {number|string} amount - The amount to format
 * @param {object} options - Formatting options
 * @param {string} options.currency - Currency symbol (default: '$')
 * @param {number} options.decimals - Number of decimal places (default: 2)
 * @param {boolean} options.showSign - Whether to show + or - sign (default: false)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    currency = '$',
    decimals = 2,
    showSign = false
  } = options;

  // Handle null, undefined, or invalid values
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${currency}0.${'0'.repeat(decimals)}`;
  }

  const num = parseFloat(amount);
  
  // Handle zero
  if (num === 0) {
    return `${currency}0.${'0'.repeat(decimals)}`;
  }

  // Format with proper comma separators
  const formatted = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  // Add currency symbol and sign
  let result = `${currency}${formatted}`;
  
  if (showSign) {
    result = num >= 0 ? `+${result}` : `-${result}`;
  } else if (num < 0) {
    result = `-${result}`;
  }

  return result;
};

/**
 * Format amount for transaction display with appropriate sign
 * @param {number|string} amount - The transaction amount
 * @param {string} type - Transaction type ('credit' or 'debit')
 * @returns {string} Formatted transaction amount with sign
 */
export const formatTransactionAmount = (amount, type) => {
  const isCredit = type === 'credit';
  const sign = isCredit ? '+' : '-';
  const formatted = formatCurrency(Math.abs(parseFloat(amount) || 0));
  
  return `${sign}${formatted}`;
};

/**
 * Format balance display without sign
 * @param {number|string} balance - The balance amount
 * @returns {string} Formatted balance
 */
export const formatBalance = (balance) => {
  return formatCurrency(balance);
};

/**
 * Format amount for admin display
 * @param {number|string} amount - The amount
 * @param {boolean} withSign - Whether to include +/- sign
 * @returns {string} Formatted amount
 */
export const formatAdminAmount = (amount, withSign = false) => {
  return formatCurrency(amount, { showSign: withSign });
};