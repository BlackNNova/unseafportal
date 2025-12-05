// DEBUG VERSION: Enhanced registration function with detailed logging
// This will help us identify the exact authentication context issue

export const debugRegister = async (userData, supabaseClient) => {
  console.log('🔍 DEBUG: Starting registration with data:', {
    email: userData.email,
    grant_number: userData.grant_number,
    first_name: userData.first_name,
    last_name: userData.last_name
  });

  try {
    // STEP 1: Create auth user
    console.log('🔍 DEBUG: Step 1 - Creating auth user...');
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: userData.email,
      password: userData.password
    });
    
    if (authError) {
      console.error('❌ DEBUG: Auth creation failed:', authError);
      throw authError;
    }
    
    console.log('✅ DEBUG: Auth user created:', {
      user_id: authData.user?.id,
      email: authData.user?.email,
      confirmed_at: authData.user?.confirmed_at,
      session: authData.session ? 'Session exists' : 'No session'
    });

    // STEP 2: Check current auth state
    console.log('🔍 DEBUG: Step 2 - Checking current auth state...');
    const { data: currentSession } = await supabaseClient.auth.getSession();
    
    console.log('🔍 DEBUG: Current session state:', {
      has_session: !!currentSession.session,
      session_user_id: currentSession.session?.user?.id,
      access_token: currentSession.session?.access_token ? 'Token exists' : 'No token'
    });

    // STEP 3: Test auth.uid() availability
    console.log('🔍 DEBUG: Step 3 - Testing auth.uid() availability...');
    const { data: testQuery, error: testError } = await supabaseClient
      .from('users')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('⚠️ DEBUG: Test query failed (might indicate auth issues):', testError);
    } else {
      console.log('✅ DEBUG: Basic query works, auth context likely OK');
    }

    // STEP 4: Generate account number
    console.log('🔍 DEBUG: Step 4 - Generating account number...');
    const { data: accountNum, error: accountError } = await supabaseClient
      .rpc('generate_account_number', { grant_num: userData.grant_number });
    
    if (accountError) {
      console.error('❌ DEBUG: Account number generation failed:', accountError);
      throw accountError;
    }
    
    console.log('✅ DEBUG: Account number generated:', accountNum);

    // STEP 5: Prepare INSERT data
    const insertData = {
      id: authData.user.id,
      email: userData.email,
      grant_number: userData.grant_number,
      first_name: userData.first_name,
      last_name: userData.last_name,
      mobile: userData.mobile || null,
      country: userData.country || null,
      account_number: accountNum,
        balance: 0.00,
      account_status: 'pending',
      kyc_status: 'pending'
    };

    console.log('🔍 DEBUG: Step 5 - Preparing INSERT with data:', insertData);

    // STEP 6: Attempt the INSERT with detailed error capture
    console.log('🔍 DEBUG: Step 6 - Attempting INSERT...');
    const { data: profile, error: profileError } = await supabaseClient
      .from('users')
      .insert(insertData)
      .select()
      .single();

    if (profileError) {
      console.error('❌ DEBUG: Profile INSERT failed with full error:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint,
        error_object: profileError
      });
      
      // Try to get more context about the RLS failure
      console.log('🔍 DEBUG: Attempting to diagnose RLS context...');
      const { data: authUser } = await supabaseClient.auth.getUser();
      console.log('🔍 DEBUG: Current auth user during INSERT:', {
        user_exists: !!authUser.user,
        user_id: authUser.user?.id,
        user_id_matches_insert: authUser.user?.id === authData.user.id
      });
      
      throw profileError;
    }
    
    console.log('✅ DEBUG: Profile created successfully:', profile);
    return { user: authData.user, profile };

  } catch (error) {
    console.error('💥 DEBUG: Registration failed at some point:', {
      error_message: error.message,
      error_code: error.code,
      stack_trace: error.stack
    });
    throw error;
  }
};

// Function to test the current auth context
export const testAuthContext = async (supabaseClient) => {
  console.log('🧪 AUTH CONTEXT TEST: Starting...');
  
  const { data: session } = await supabaseClient.auth.getSession();
  console.log('Session:', !!session.session);
  
  const { data: user } = await supabaseClient.auth.getUser();
  console.log('User:', !!user.user);
  
  // Test if we can query with current context
  const { data, error } = await supabaseClient
    .from('users')
    .select('id')
    .limit(1);
    
  console.log('Query test:', error ? 'FAILED' : 'SUCCESS');
  if (error) console.log('Query error:', error);
  
  return {
    hasSession: !!session.session,
    hasUser: !!user.user,
    canQuery: !error
  };
};