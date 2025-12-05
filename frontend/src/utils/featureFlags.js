/**
 * Feature Flags Configuration
 * Controls gradual rollout of new features including Project Payments
 */

// Feature flag configuration
const FEATURE_FLAGS = {
  // Project Payments Feature Flag
  PROJECT_PAYMENTS_ENABLED: {
    // Environment-based feature flag
    development: true,     // Always enabled in development
    staging: true,         // Always enabled in staging
    production: false,     // Disabled in production initially for safety
    
    // User-based rollout (can be expanded)
    enabledUsers: [
      // Add specific user IDs for gradual rollout
      // 'user-id-1', 'user-id-2'
    ],
    
    // Admin override
    adminOverride: true    // Admins can always access new features
  },
  
  // Additional feature flags can be added here
  ENHANCED_ERROR_HANDLING: true,
  DEBUG_LOGGING: false
};

/**
 * Check if Project Payments feature is enabled for current environment/user
 * @param {string} userId - Current user ID (optional)
 * @param {boolean} isAdmin - Whether current user is admin (optional)
 * @returns {boolean} - Whether feature is enabled
 */
export const isProjectPaymentsEnabled = (userId = null, isAdmin = false) => {
  const config = FEATURE_FLAGS.PROJECT_PAYMENTS_ENABLED;
  
  // Admin override
  if (isAdmin && config.adminOverride) {
    console.log('🔓 Feature Flag: Project Payments enabled (Admin Override)');
    return true;
  }
  
  // Environment-based check
  const environment = process.env.NODE_ENV || 'development';
  console.log('🏷️ Feature Flag: Current environment:', environment);
  
  if (config[environment] === true) {
    console.log('✅ Feature Flag: Project Payments enabled (Environment)');
    return true;
  }
  
  // User-based rollout
  if (userId && config.enabledUsers.includes(userId)) {
    console.log('✅ Feature Flag: Project Payments enabled (User Whitelist)');
    return true;
  }
  
  console.log('❌ Feature Flag: Project Payments disabled');
  return false;
};

/**
 * Get feature flag status for debugging
 * @returns {object} - Current feature flag status
 */
export const getFeatureFlagStatus = () => {
  return {
    environment: process.env.NODE_ENV || 'development',
    flags: FEATURE_FLAGS,
    timestamp: new Date().toISOString()
  };
};

/**
 * Enable Project Payments feature (for admin use)
 * @param {string} environment - Environment to enable for
 */
export const enableProjectPayments = (environment = 'production') => {
  console.log(`🔧 Feature Flag: Enabling Project Payments for ${environment}`);
  FEATURE_FLAGS.PROJECT_PAYMENTS_ENABLED[environment] = true;
  
  // Log the change
  console.log('🎯 Feature Flag Status:', getFeatureFlagStatus());
};

/**
 * Disable Project Payments feature (for admin use)
 * @param {string} environment - Environment to disable for
 */
export const disableProjectPayments = (environment = 'production') => {
  console.log(`🔒 Feature Flag: Disabling Project Payments for ${environment}`);
  FEATURE_FLAGS.PROJECT_PAYMENTS_ENABLED[environment] = false;
  
  // Log the change
  console.log('🎯 Feature Flag Status:', getFeatureFlagStatus());
};

/**
 * Add user to Project Payments whitelist
 * @param {string} userId - User ID to add
 */
export const addUserToProjectPayments = (userId) => {
  if (!FEATURE_FLAGS.PROJECT_PAYMENTS_ENABLED.enabledUsers.includes(userId)) {
    FEATURE_FLAGS.PROJECT_PAYMENTS_ENABLED.enabledUsers.push(userId);
    console.log(`👤 Feature Flag: Added user ${userId} to Project Payments whitelist`);
  }
};

export default FEATURE_FLAGS;