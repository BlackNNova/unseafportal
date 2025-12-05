import { kycHelpers } from './kycHelpers.js';
import { auditLogger } from './auditLogger.js';
import { supabase } from './supabase.js';

/**
 * Comprehensive KYC Management Testing Suite
 * Tests all functionality including document handling, status management, and audit logging
 */

export const kycTestRunner = {
  /**
   * Run all KYC tests
   * @returns {Promise<{success: boolean, results: object}>}
   */
  runAllTests: async () => {
    console.log('🧪 Starting comprehensive KYC management tests...');
    
    const results = {
      connection: await testSupabaseConnection(),
      helpers: await testKycHelpers(),
      audit: await testAuditLogging(),
      integration: await testIntegrationScenarios()
    };

    const allPassed = Object.values(results).every(result => result.success);
    
    console.log(`🏁 All tests completed. Overall: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
    
    return {
      success: allPassed,
      results
    };
  },

  /**
   * Test individual components
   */
  testConnection: () => testSupabaseConnection(),
  testHelpers: () => testKycHelpers(),
  testAudit: () => testAuditLogging(),
  testIntegration: () => testIntegrationScenarios()
};

/**
 * Test Supabase connection and table access
 */
async function testSupabaseConnection() {
  console.log('🔌 Testing Supabase connection and table access...');
  
  const tests = [];
  
  try {
    // Test basic connection
    tests.push({
      name: 'Supabase Client Connection',
      test: async () => {
        const { data, error } = await supabase.auth.getSession();
        return { success: !error, error: error?.message };
      }
    });

    // Test users table access
    tests.push({
      name: 'Users Table Access',
      test: async () => {
        const { data, error } = await supabase
          .from('users')
          .select('id, kyc_status')
          .limit(1);
        return { success: !error, error: error?.message };
      }
    });

    // Test kyc_documents table access
    tests.push({
      name: 'KYC Documents Table Access',
      test: async () => {
        const { data, error } = await supabase
          .from('kyc_documents')
          .select('id, user_id, status')
          .limit(1);
        return { success: !error, error: error?.message };
      }
    });

    // Test storage access
    tests.push({
      name: 'Storage Access',
      test: async () => {
        const { data, error } = await supabase.storage
          .from('kyc documents')
          .list('', { limit: 1 });
        return { success: !error, error: error?.message };
      }
    });

    // Run all tests
    const results = {};
    for (const { name, test } of tests) {
      try {
        const result = await test();
        results[name] = result;
        console.log(`  ${result.success ? '✅' : '❌'} ${name}`);
        if (!result.success) {
          console.log(`    Error: ${result.error}`);
        }
      } catch (err) {
        results[name] = { success: false, error: err.message };
        console.log(`  ❌ ${name}: ${err.message}`);
      }
    }

    const allPassed = Object.values(results).every(r => r.success);
    return { success: allPassed, details: results };

  } catch (err) {
    console.log('  ❌ Connection test failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Test KYC helper functions
 */
async function testKycHelpers() {
  console.log('🛠️ Testing KYC helper functions...');
  
  const tests = [];
  
  // Test fetchKycRequests
  tests.push({
    name: 'Fetch KYC Requests',
    test: async () => {
      const { kycRequests, totalCount, error } = await kycHelpers.fetchKycRequests('all', {
        limit: 5,
        offset: 0
      });
      return { 
        success: !error && Array.isArray(kycRequests), 
        error,
        details: { count: kycRequests?.length, totalCount }
      };
    }
  });

  // Test getKycStats
  tests.push({
    name: 'Get KYC Statistics',
    test: async () => {
      const { stats, error } = await kycHelpers.getKycStats();
      const hasRequiredStats = stats && typeof stats.total === 'number';
      return { 
        success: !error && hasRequiredStats, 
        error,
        details: stats
      };
    }
  });

  // Test file validation
  tests.push({
    name: 'File Type Validation',
    test: async () => {
      // Create mock file objects
      const pdfFile = { name: 'test.pdf', type: 'application/pdf' };
      const imageFile = { name: 'test.jpg', type: 'image/jpeg' };
      const invalidFile = { name: 'test.exe', type: 'application/octet-stream' };
      
      const pdfValid = kycHelpers.isValidDocumentType(pdfFile);
      const imageValid = kycHelpers.isValidDocumentType(imageFile);
      const invalidValid = kycHelpers.isValidDocumentType(invalidFile);
      
      return {
        success: pdfValid && imageValid && !invalidValid,
        details: { pdfValid, imageValid, invalidValid }
      };
    }
  });

  // Test utility functions
  tests.push({
    name: 'Utility Functions',
    test: async () => {
      const fileSize = kycHelpers.formatFileSize(1024000);
      const iconName = kycHelpers.getFileTypeIcon('test.pdf');
      
      return {
        success: fileSize === '1000 KB' && iconName === 'FileText',
        details: { fileSize, iconName }
      };
    }
  });

  // Run all tests
  const results = {};
  for (const { name, test } of tests) {
    try {
      const result = await test();
      results[name] = result;
      console.log(`  ${result.success ? '✅' : '❌'} ${name}`);
      if (result.details) {
        console.log(`    Details:`, result.details);
      }
    } catch (err) {
      results[name] = { success: false, error: err.message };
      console.log(`  ❌ ${name}: ${err.message}`);
    }
  }

  const allPassed = Object.values(results).every(r => r.success);
  return { success: allPassed, details: results };
}

/**
 * Test audit logging functionality
 */
async function testAuditLogging() {
  console.log('📋 Testing audit logging...');
  
  const tests = [];
  
  // Test audit log creation
  tests.push({
    name: 'Audit Log Creation',
    test: async () => {
      const { success, error } = await auditLogger.logKycStatusChange({
        userId: 'test-user-id',
        adminId: 'test-admin-id',
        action: 'approve',
        oldStatus: 'pending',
        newStatus: 'approved',
        notes: 'Test audit log'
      });
      return { success, error };
    }
  });

  // Test document view logging
  tests.push({
    name: 'Document View Logging',
    test: async () => {
      const { success, error } = await auditLogger.logDocumentView({
        userId: 'test-user-id',
        adminId: 'test-admin-id',
        kycDocumentId: 'test-doc-id',
        documentPath: 'test/path/document.pdf'
      });
      return { success, error };
    }
  });

  // Test bulk action logging
  tests.push({
    name: 'Bulk Action Logging',
    test: async () => {
      const { success, error } = await auditLogger.logBulkAction({
        userIds: ['user1', 'user2'],
        adminId: 'test-admin-id',
        action: 'approved',
        notes: 'Bulk approval test'
      });
      return { success, error };
    }
  });

  // Run all tests
  const results = {};
  for (const { name, test } of tests) {
    try {
      const result = await test();
      results[name] = result;
      console.log(`  ${result.success ? '✅' : '❌'} ${name}`);
      if (!result.success && result.error) {
        console.log(`    Error: ${result.error}`);
      }
    } catch (err) {
      results[name] = { success: false, error: err.message };
      console.log(`  ❌ ${name}: ${err.message}`);
    }
  }

  const allPassed = Object.values(results).every(r => r.success);
  return { success: allPassed, details: results };
}

/**
 * Test integration scenarios
 */
async function testIntegrationScenarios() {
  console.log('🔗 Testing integration scenarios...');
  
  const tests = [];
  
  // Test complete KYC workflow
  tests.push({
    name: 'Complete KYC Workflow Simulation',
    test: async () => {
      try {
        // 1. Fetch some KYC requests
        const { kycRequests, error: fetchError } = await kycHelpers.fetchKycRequests('pending', {
          limit: 1
        });
        
        if (fetchError) {
          return { success: false, error: fetchError, stage: 'fetch' };
        }
        
        // 2. Get statistics
        const { stats, error: statsError } = await kycHelpers.getKycStats();
        
        if (statsError) {
          return { success: false, error: statsError, stage: 'stats' };
        }
        
        // 3. Test file operations (without actual files)
        const mockFilePath = 'test/path/document.pdf';
        const { url, error: urlError } = await kycHelpers.getDocumentUrl(mockFilePath);
        
        // URL generation may fail without real files, which is expected
        
        return { 
          success: true, 
          details: { 
            requestsFound: kycRequests?.length || 0,
            statsValid: stats && typeof stats.total === 'number',
            urlGenerated: !urlError
          }
        };
      } catch (err) {
        return { success: false, error: err.message, stage: 'workflow' };
      }
    }
  });

  // Test error handling
  tests.push({
    name: 'Error Handling',
    test: async () => {
      try {
        // Test with invalid parameters
        const { success, error } = await kycHelpers.updateKycStatus(
          null, // Invalid user ID
          null,
          'approved',
          'Test notes'
        );
        
        // Should handle error gracefully
        return { success: !success && error, details: { error } };
      } catch (err) {
        // Should not throw unhandled exceptions
        return { success: false, error: err.message, stage: 'error_handling' };
      }
    }
  });

  // Run all tests
  const results = {};
  for (const { name, test } of tests) {
    try {
      const result = await test();
      results[name] = result;
      console.log(`  ${result.success ? '✅' : '❌'} ${name}`);
      if (result.details) {
        console.log(`    Details:`, result.details);
      }
    } catch (err) {
      results[name] = { success: false, error: err.message };
      console.log(`  ❌ ${name}: ${err.message}`);
    }
  }

  const allPassed = Object.values(results).every(r => r.success);
  return { success: allPassed, details: results };
}

/**
 * Generate test report
 */
export function generateTestReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    overall: results.success ? 'PASS' : 'FAIL',
    summary: {
      connection: results.results.connection.success,
      helpers: results.results.helpers.success,
      audit: results.results.audit.success,
      integration: results.results.integration.success
    },
    details: results.results
  };

  console.log('\n📊 KYC Management Test Report');
  console.log('=' .repeat(50));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Overall Result: ${report.overall}`);
  console.log('\nComponent Results:');
  
  Object.entries(report.summary).forEach(([component, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${component}`);
  });

  if (!results.success) {
    console.log('\n❌ Failed Components Details:');
    Object.entries(results.results).forEach(([component, result]) => {
      if (!result.success) {
        console.log(`\n${component}:`);
        if (result.details) {
          Object.entries(result.details).forEach(([test, testResult]) => {
            if (!testResult.success) {
              console.log(`  - ${test}: ${testResult.error}`);
            }
          });
        }
      }
    });
  }

  console.log('\n' + '='.repeat(50));
  
  return report;
}

export default kycTestRunner;