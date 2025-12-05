// DEBUG SCRIPT: Auth User Creation Issue
// Run this in browser console on your registration page to debug the issue

console.log('🔍 DEBUGGING AUTH USER CREATION ISSUE');

// Check if the issue is with email validation or auth user creation
const debugRegistration = async () => {
  console.log('🧪 Starting debug registration...');
  
  try {
    // Test auth user creation without profile creation
    const testEmail = 'debug-test-' + Date.now() + '@test.com';
    const testPassword = 'TestPassword123!';
    
    console.log('📧 Testing with email:', testEmail);
    
    // Step 1: Test auth user creation
    console.log('🔄 Step 1: Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (authError) {
      console.error('❌ Auth creation failed:', authError);
      return;
    }
    
    if (!authData.user) {
      console.error('❌ No user data returned from signUp');
      return;
    }
    
    console.log('✅ Auth user created successfully:');
    console.log('- User ID:', authData.user.id);
    console.log('- Email confirmed:', authData.user.email_confirmed_at);
    console.log('- Created at:', authData.user.created_at);
    console.log('- Session available:', !!authData.session);
    
    // Step 2: Check if user exists in auth.users (using a simple query)
    console.log('🔄 Step 2: Checking if auth user is visible...');
    
    // Wait a moment for any async operations
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to fetch the auth user again
    const { data: currentUser, error: userError } = await supabase.auth.getUser();
    console.log('Current user check:', currentUser, userError);
    
    // Step 3: Test the create_user_profile function directly
    console.log('🔄 Step 3: Testing create_user_profile function...');
    
    const { data: profileResult, error: profileError } = await supabase
      .rpc('create_user_profile', {
        p_user_id: authData.user.id,
        p_email: testEmail,
        p_grant_number: 'UNSEAF-2025/GR-9999', // Test grant number
        p_first_name: 'Debug',
        p_last_name: 'Test',
        p_mobile: '1234567890',
        p_country: 'Test Country',
        p_account_number: 'TEST-001'
      });
    
    if (profileError) {
      console.error('❌ Profile creation failed:', profileError);
      console.log('This confirms the issue - auth user not visible to the function');
    } else {
      console.log('✅ Profile created successfully:', profileResult);
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error);
  }
};

// Also check your Supabase email settings
console.log('🔧 CHECKING SUPABASE EMAIL SETTINGS:');
console.log('1. Go to Supabase Dashboard > Authentication > Settings');
console.log('2. Check "Enable email confirmations" setting');
console.log('3. If enabled, new users need email confirmation before they appear in auth.users');
console.log('4. Try disabling it temporarily for testing');

// Run the debug
debugRegistration();