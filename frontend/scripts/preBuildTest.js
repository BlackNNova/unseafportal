import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const runPreBuildTests = async () => {
  console.log('🧪 TEST: Starting comprehensive pre-build validation...');
  
  const tests = [
    {
      name: 'Console Log Check',
      test: () => {
        const adminDashboardPath = join(projectRoot, 'src/components/AdminDashboard.jsx');
        const content = fs.readFileSync(adminDashboardPath, 'utf8');
        const logCount = (content.match(/console\.log.*TEST/g) || []).length;
        console.log(`Found ${logCount} test console.log statements`);
        return logCount >= 10;
      },
      critical: true
    },
    {
      name: 'Property Name Check',
      test: () => {
        const adminDashboardPath = join(projectRoot, 'src/components/AdminDashboard.jsx');
        const content = fs.readFileSync(adminDashboardPath, 'utf8');
        const hasSnakeCase = content.includes('total_users') && 
                            content.includes('active_users') && 
                            content.includes('pending_kyc');
        console.log('Snake case properties found:', hasSnakeCase);
        return hasSnakeCase;
      },
      critical: true
    },
    {
      name: 'Support Tickets Disabled Check',
      test: () => {
        const adminDashboardPath = join(projectRoot, 'src/components/AdminDashboard.jsx');
        const content = fs.readFileSync(adminDashboardPath, 'utf8');
        const isDisabled = content.includes('// await fetchSupportTickets()') &&
                          content.includes('DISABLED FOR TESTING');
        console.log('Support tickets disabled:', isDisabled);
        return isDisabled;
      },
      critical: true
    },
    {
      name: 'Helper Files Check',
      test: () => {
        const supabaseTestPath = join(projectRoot, 'src/utils/supabaseTest.js');
        const userHelpersPath = join(projectRoot, 'src/utils/userHelpers.js');
        
        const supabaseTestExists = fs.existsSync(supabaseTestPath);
        const userHelpersExists = fs.existsSync(userHelpersPath);
        
        console.log('supabaseTest.js exists:', supabaseTestExists);
        console.log('userHelpers.js exists:', userHelpersExists);
        
        return supabaseTestExists && userHelpersExists;
      },
      critical: true
    },
    {
      name: 'Error Boundary Check',
      test: () => {
        const errorBoundaryPath = join(projectRoot, 'src/components/AdminErrorBoundary.jsx');
        const appPath = join(projectRoot, 'src/App.jsx');
        
        const errorBoundaryExists = fs.existsSync(errorBoundaryPath);
        const appContent = fs.readFileSync(appPath, 'utf8');
        const errorBoundaryImported = appContent.includes('AdminErrorBoundary');
        
        console.log('AdminErrorBoundary.jsx exists:', errorBoundaryExists);
        console.log('AdminErrorBoundary imported in App.jsx:', errorBoundaryImported);
        
        return errorBoundaryExists && errorBoundaryImported;
      },
      critical: true
    },
    {
      name: 'Refresh Fix Check (.htaccess)',
      test: () => {
        const htaccessPublicPath = join(projectRoot, 'public/.htaccess');
        const htaccessDistPath = join(projectRoot, 'dist/.htaccess');
        
        const publicExists = fs.existsSync(htaccessPublicPath);
        const distExists = fs.existsSync(htaccessDistPath);
        
        if (publicExists) {
          const content = fs.readFileSync(htaccessPublicPath, 'utf8');
          const hasRewriteRules = content.includes('RewriteEngine On') && 
                                 content.includes('index.html [QSA,L]');
          console.log('public/.htaccess exists:', publicExists);
          console.log('dist/.htaccess exists:', distExists);
          console.log('Has proper SPA rewrite rules:', hasRewriteRules);
          return hasRewriteRules;
        }
        
        return false;
      },
      critical: true
    },
    {
      name: 'Authentication Logging Check',
      test: () => {
        const protectedRoutePath = join(projectRoot, 'src/components/ProtectedRoute.jsx');
        const adminProtectedRoutePath = join(projectRoot, 'src/components/AdminProtectedRoute.jsx');
        
        const protectedContent = fs.readFileSync(protectedRoutePath, 'utf8');
        const adminProtectedContent = fs.readFileSync(adminProtectedRoutePath, 'utf8');
        
        const protectedHasLogging = (protectedContent.match(/console\.log.*TEST.*refresh/gi) || []).length >= 1;
        const adminProtectedHasLogging = (adminProtectedContent.match(/console\.log.*TEST.*refresh/gi) || []).length >= 1;
        
        console.log('ProtectedRoute has refresh logging:', protectedHasLogging);
        console.log('AdminProtectedRoute has refresh logging:', adminProtectedHasLogging);
        
        return protectedHasLogging && adminProtectedHasLogging;
      },
      critical: true
    }
  ];
  
  let allPassed = true;
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`\n🧪 Running: ${test.name}`);
      
      const result = test.test();
      
      if (!result && test.critical) {
        console.error(`❌ ${test.name} FAILED`);
        allPassed = false;
        results.push({ name: test.name, passed: false, critical: test.critical });
      } else {
        console.log(`✅ ${test.name} PASSED`);
        results.push({ name: test.name, passed: true, critical: test.critical });
      }
    } catch (error) {
      console.error(`❌ ${test.name} ERROR:`, error.message);
      if (test.critical) allPassed = false;
      results.push({ name: test.name, passed: false, critical: test.critical, error: error.message });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🧪 PRE-BUILD VALIDATION SUMMARY:');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    const priority = result.critical ? '[CRITICAL]' : '[INFO]';
    console.log(`${status} ${priority} ${result.name}`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });
  
  const criticalFailures = results.filter(r => !r.passed && r.critical).length;
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  
  console.log('='.repeat(60));
  console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`);
  console.log(`⚠️  Critical failures: ${criticalFailures}`);
  
  if (allPassed) {
    console.log('🎉 All critical tests passed! Ready for build.');
  } else {
    console.log('🚫 Critical tests failed! Fix issues before building.');
  }
  
  console.log('='.repeat(60));
  return allPassed;
};

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runPreBuildTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Pre-build validation failed:', error);
    process.exit(1);
  });
}
