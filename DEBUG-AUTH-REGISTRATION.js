// ============================================================================
// DEBUG SCRIPT: Test Actual Supabase Auth Registration
// ============================================================================
// Run this in browser console on your registration page

console.log('🔍 DEBUGGING ACTUAL AUTH REGISTRATION');

const debugAuthRegistration = async () => {
  try {
    // Test with a simple email
    const testEmail = 'test-debug-' + Date.now() + '@example.com';
    const testPassword = 'TestPassword123!';
    
    console.log('📧 Testing auth registration with:', testEmail);
    console.log('🔑 Using password:', testPassword);
    
    // CRITICAL: Test raw Supabase auth.signUp
    console.log('🔄 Calling supabase.auth.signUp...');
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    console.log('📊 RAW AUTH RESPONSE:');
    console.log('- Data:', authData);
    console.log('- Error:', authError);
    console.log('- User ID:', authData?.user?.id);
    console.log('- Session:', authData?.session);
    console.log('- User object:', authData?.user);
    
    if (authError) {
      console.error('❌ AUTH REGISTRATION FAILED:', authError);
      console.error('❌ This explains why no auth users are created!');
      return;
    }
    
    if (!authData?.user?.id) {
      console.error('❌ NO USER ID RETURNED - Auth registration fake success!');
      return;
    }
    
    // Wait a moment then check if user actually exists
    console.log('⏳ Waiting 2 seconds then checking if user exists in database...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to fetch the user from auth
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('👤 Current user check:', userData, userError);
    
    console.log('✅ AUTH REGISTRATION DEBUG COMPLETE');
    console.log('🎯 If you see this, auth registration is working');
    console.log('🎯 The problem might be elsewhere');
    
  } catch (error) {
    console.error('💥 DEBUG SCRIPT FAILED:', error);
  }
};

// Check Supabase configuration
console.log('🔧 SUPABASE CLIENT CONFIG:');
console.log('- URL:', supabase.supabaseUrl);
console.log('- Key:', supabase.supabaseKey ? 'Present' : 'Missing');

// Check if supabase object is available
if (typeof supabase === 'undefined') {
  console.error('❌ SUPABASE NOT AVAILABLE - Make sure you are on the registration page');
} else {
  debugAuthRegistration();
}