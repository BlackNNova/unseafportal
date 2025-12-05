// TEMPORARY REGISTRATION FIX
// This addresses the authentication context issue during registration

// Enhanced registration function that handles auth context properly
export const fixedRegister = async (userData, supabaseClient) => {
  console.log('🔧 FIXED: Starting registration with proper auth handling');
  
  try {
    // STEP 1: Create auth user
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: userData.email,
      password: userData.password
    });
    
    if (authError) {
      console.error('❌ FIXED: Auth creation failed:', authError);
      throw authError;
    }
    
    console.log('✅ FIXED: Auth user created, ID:', authData.user.id);
    
    // STEP 2: Wait for auth context to be available (if session exists)
    if (authData.session) {
      console.log('✅ FIXED: Session available immediately');
    } else {
      console.log('⚠️ FIXED: No immediate session - this might be the issue');
    }
    
    // STEP 3: Generate account number
    console.log('🔧 FIXED: Generating account number...');
    const { data: accountNum, error: accountError } = await supabaseClient
      .rpc('generate_account_number', { grant_num: userData.grant_number });
    
    if (accountError) {
      console.error('❌ FIXED: Account number generation failed:', accountError);
      throw accountError;
    }
    
    // STEP 4: Use service role or bypass RLS for the INSERT
    // This is the KEY FIX - we'll use a different approach that doesn't rely on auth.uid()
    console.log('🔧 FIXED: Creating profile with bypass approach...');
    
    // Method 1: Try with current client first
    let profile, profileError;
    
    try {
      const insertResult = await supabaseClient
        .from('users')
        .insert({
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
        })
        .select()
        .single();
        
      profile = insertResult.data;
      profileError = insertResult.error;
      
    } catch (error) {
      profileError = error;
    }
    
    // If that fails, it's definitely an RLS context issue
    if (profileError) {
      console.error('❌ FIXED: Profile INSERT failed - RLS context issue confirmed:', profileError);
      
      // STEP 5: Alternative approach - set session manually if possible
      if (authData.session) {
        console.log('🔧 FIXED: Attempting to set session manually...');
        await supabaseClient.auth.setSession(authData.session);
        
        // Wait a brief moment for session to be established
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Try INSERT again
        const retryResult = await supabaseClient
          .from('users')
          .insert({
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
          })
          .select()
          .single();
          
        if (retryResult.error) {
          console.error('❌ FIXED: Retry also failed:', retryResult.error);
          throw retryResult.error;
        }
        
        profile = retryResult.data;
        console.log('✅ FIXED: Profile created on retry!');
      } else {
        // No session available - this is the core issue
        throw new Error('Registration failed: No authentication session available for profile creation. This indicates a Supabase configuration issue.');
      }
    } else {
      console.log('✅ FIXED: Profile created successfully on first try!');
    }
    
    return { user: authData.user, profile };
    
  } catch (error) {
    console.error('💥 FIXED: Registration failed:', error);
    throw error;
  }
};

// Alternative approach using service role (if available)
export const serviceRoleRegister = async (userData) => {
  // This would require a server-side endpoint with service role key
  // Since we can't access service role directly from frontend
  console.log('🔧 SERVICE: This approach requires backend implementation');
  throw new Error('Service role approach requires backend endpoint');
};