import React, { useState, useEffect } from 'react';
import TransferPage from './TransferPage';
import ProjectPaymentsPage from './ProjectPaymentsPage';

// Load feature flags configuration
// SIMPLIFIED: Always return true for ProjectPayments
const loadFeatureFlags = () => {
  console.log('🔧 Loading feature flags - ProjectPayments ALWAYS ENABLED');
  
  // FORCED CONFIGURATION - No environment variables, no conditionals
  // Always use ProjectPaymentsPage
  const config = {
    projectPayments: true,  // HARDCODED TRUE
    developmentMode: false
  };
  
  console.log('🔧 Feature flags loaded:', config);
  return config;
};

/**
 * FeatureFlagWrapper - Conditional component that renders either
 * TransferPage (legacy) or ProjectPaymentsPage (new) based on feature flags
 */
const FeatureFlagWrapper = ({ userFeatures = {}, adminOverride = false }) => {
  const [featureFlags, setFeatureFlags] = useState(loadFeatureFlags());
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading time for feature flag initialization
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Determine which component to render
  const shouldUseProjectPayments = () => {
    // Admin override takes precedence
    if (adminOverride) {
      console.log('🚀 FeatureFlag: Admin override enabled - using ProjectPaymentsPage');
      return true;
    }
    
    // Check user-specific feature flags
    if (userFeatures.projectPayments === true) {
      console.log('🚀 FeatureFlag: User-specific flag enabled - using ProjectPaymentsPage');
      return true;
    }
    
    // Check global feature flags
    if (featureFlags.projectPayments) {
      console.log('🚀 FeatureFlag: Global flag enabled - using ProjectPaymentsPage');
      return true;
    }
    
    // Development mode fallback (for testing)
    if (featureFlags.developmentMode) {
      console.log('🧪 FeatureFlag: Development mode - checking localStorage override');
      const devOverride = localStorage.getItem('dev_project_payments');
      if (devOverride === 'true') {
        return true;
      }
    }
    
    // Default to legacy TransferPage
    console.log('📝 FeatureFlag: Using legacy TransferPage');
    return false;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Log feature flag decision for debugging
  const useProjectPayments = shouldUseProjectPayments();
  console.log('🏗️ FeatureFlagWrapper rendering:', {
    useProjectPayments,
    featureFlags,
    userFeatures,
    adminOverride,
    developmentMode: featureFlags.developmentMode
  });
  
  // Render appropriate component
  if (useProjectPayments) {
    return <ProjectPaymentsPage />;
  } else {
    return <TransferPage />;
  }
};

// Helper function to enable project payments in development
export const enableProjectPaymentsInDev = () => {
  if (process.env.NODE_ENV === 'development') {
    localStorage.setItem('dev_project_payments', 'true');
    console.log('🧪 Development override enabled: Project Payments will be used on next render');
    return true;
  }
  console.warn('Development override only available in development mode');
  return false;
};

// Helper function to disable project payments in development
export const disableProjectPaymentsInDev = () => {
  localStorage.removeItem('dev_project_payments');
  console.log('🧪 Development override disabled: Transfer Page will be used on next render');
};

export default FeatureFlagWrapper;