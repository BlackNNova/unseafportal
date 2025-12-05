-- ============================================================================
-- CREATE USER PROFILE FUNCTION - SECURITY DEFINER APPROACH
-- ============================================================================
-- This function creates user profiles with elevated privileges to bypass
-- Row Level Security issues that cause foreign key constraint violations

CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_grant_number TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_mobile TEXT,
  p_country TEXT,
  p_account_number TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_created BOOLEAN := FALSE;
BEGIN
  -- Validate that the auth user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Auth user not found with ID: ' || p_user_id::text
    );
  END IF;

  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Profile already exists for user ID: ' || p_user_id::text
    );
  END IF;

  -- Insert the user profile
  INSERT INTO public.users (
    id,
    email,
    grant_number,
    first_name,
    last_name,
    mobile,
    country,
    account_number,
    balance,
    account_status,
    kyc_status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_email,
    p_grant_number,
    p_first_name,
    p_last_name,
    p_mobile,
    p_country,
    p_account_number,
    0.00,
    'pending',
    'pending',
    NOW(),
    NOW()
  );

  GET DIAGNOSTICS v_profile_created = ROW_COUNT;

  IF v_profile_created THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Profile created successfully',
      'user_id', p_user_id
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Profile creation failed - no rows inserted'
    );
  END IF;

EXCEPTION WHEN foreign_key_violation THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Foreign key violation: Auth user not found in auth.users table'
  );
WHEN unique_violation THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Profile already exists or duplicate constraint violation'
  );
WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Profile creation failed: ' || SQLERRM
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;

-- Test and completion message
DO $$
BEGIN
  RAISE NOTICE '✅ CREATE USER PROFILE FUNCTION CREATED!';
  RAISE NOTICE '🔧 Function: create_user_profile with SECURITY DEFINER';
  RAISE NOTICE '🛡️ Bypasses RLS to prevent foreign key constraint violations';
  RAISE NOTICE '🎯 Ready for hybrid registration flow!';
END $$;