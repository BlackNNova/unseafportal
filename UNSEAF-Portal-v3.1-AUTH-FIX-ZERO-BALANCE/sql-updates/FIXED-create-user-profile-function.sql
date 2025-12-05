-- ============================================================================
-- ENHANCED CREATE USER PROFILE FUNCTION - v2.1 (Bug-Safe Update)
-- ============================================================================
-- MAINTAINS ALL PREVIOUS BUG FIXES:
-- - Bug #003: SECURITY DEFINER to bypass RLS (FK violations)
-- - Bug #001: Proper auth user validation 
-- - NEW: Better timing and retry logic for auth user visibility
-- - ZERO BALANCE FIX: Users start with $0.00 instead of $1000

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
  v_auth_user_exists BOOLEAN := FALSE;
  v_retry_count INTEGER := 0;
  v_max_retries INTEGER := 5;
BEGIN
  -- Wait and retry loop to handle timing issues
  WHILE v_retry_count < v_max_retries LOOP
    -- Check if the auth user exists (with retry logic)
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_auth_user_exists;
    
    IF v_auth_user_exists THEN
      EXIT; -- User found, break the loop
    END IF;
    
    -- Wait a moment and retry
    v_retry_count := v_retry_count + 1;
    RAISE NOTICE 'Waiting for auth user creation... attempt % of %', v_retry_count, v_max_retries;
    PERFORM pg_sleep(1); -- Wait 1 second
  END LOOP;

  -- Final check - if user still not found
  IF NOT v_auth_user_exists THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Auth user not found with ID: ' || p_user_id::text || '. This could be due to email confirmation requirements or timing issues.'
    );
  END IF;

  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Profile already exists for user ID: ' || p_user_id::text
    );
  END IF;

  -- Insert the user profile with zero balance
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
    0.00,  -- Zero balance as requested
    'pending',
    'pending',
    NOW(),
    NOW()
  );

  GET DIAGNOSTICS v_profile_created = ROW_COUNT;

  IF v_profile_created THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Profile created successfully with zero balance',
      'user_id', p_user_id,
      'retries_needed', v_retry_count
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Profile creation failed - no rows inserted'
    );
  END IF;

EXCEPTION 
  WHEN foreign_key_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Foreign key violation: Auth user disappeared during profile creation'
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

-- Completion message
DO $$
BEGIN
  RAISE NOTICE '✅ ENHANCED CREATE USER PROFILE FUNCTION UPDATED!';
  RAISE NOTICE '🔧 Added retry logic for auth user timing issues';
  RAISE NOTICE '🎯 Zero balance fix applied';
  RAISE NOTICE '🚀 Should handle the auth user not found error';
END $$;