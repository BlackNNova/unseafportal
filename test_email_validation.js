// Test script to diagnose email validation issue
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qghsyyyompjuxjtbqiuk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaHN5eXlvbXBqdXhqdGJxaXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1ODg1MDMsImV4cCI6MjA3MzE2NDUwM30.NFI5KLZrnWq1yTN4R8nGV5dSKDy7DmvedAFmjNdbEGY';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEmailValidation() {
  console.log('🧪 TESTING: Email validation with different addresses...');
  
  const testEmails = [
    'jadesmith@gmail.com',      // The problematic email
    'test123@gmail.com',        // Simple Gmail
    'user@example.com',         // Standard test email
    'simple@test.io',           // Different domain
    'newuser@gmail.com'         // Another Gmail
  ];
  
  for (const email of testEmails) {
    console.log(`\n🔍 Testing: ${email}`);
    
    try {
      // Test 1: Check if email already exists
      const { data: existingUser, error: checkError } = await supabase.auth.getUser();
      
      // Test 2: Attempt signup (we'll immediately delete if successful)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: 'temppassword123'
      });
      
      if (authError) {
        console.log(`❌ FAILED: ${email} - ${authError.message}`);
        console.log(`   Error Code: ${authError.status}`);
        console.log(`   Error Details:`, authError);
      } else {
        console.log(`✅ SUCCESS: ${email} - Auth user created`);
        console.log(`   User ID: ${authData.user?.id}`);
        console.log(`   Session: ${authData.session ? 'Created' : 'No session'}`);
        
        // Clean up - delete the test user immediately
        if (authData.user?.id) {
          // Note: This requires service role to delete auth users
          console.log(`🧹 Cleanup: Would delete user ${authData.user.id}`);
        }
      }
      
    } catch (error) {
      console.log(`💥 ERROR: ${email} - ${error.message}`);
    }
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Run the test
testEmailValidation().catch(console.error);

// Alternative test function for browser console
function quickEmailTest(email) {
  return supabase.auth.signUp({
    email: email,
    password: 'testpass123'
  }).then(result => {
    console.log(`Email test result for ${email}:`, result);
    return result;
  }).catch(err => {
    console.log(`Email test failed for ${email}:`, err);
    return err;
  });
}

// Export for browser use
window.quickEmailTest = quickEmailTest;
window.supabase = supabase;