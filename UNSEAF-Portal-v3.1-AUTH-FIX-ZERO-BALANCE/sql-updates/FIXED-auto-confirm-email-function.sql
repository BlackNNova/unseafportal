-- ============================================================================
-- ENHANCED AUTO EMAIL CONFIRMATION FUNCTION - v2.1 (Bug-Safe Update)
-- ============================================================================
-- MAINTAINS ALL PREVIOUS BUG FIXES:
-- - Bug #002: Hybrid approach - auto-confirm emails to eliminate manual SQL
-- - Bug #001: Proper token field handling (empty strings, not NULL)
-- - NEW: Better error diagnostics and validation
-- - PRESERVES: All existing functionality that prevented previous bugs

CREATE OR REPLACE FUNCTION public.auto_confirm_user_email(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated BOOLEAN := FALSE;
  v_user_exists BOOLEAN := FALSE;
  v_already_confirmed BOOLEAN := FALSE;
BEGIN
  -- First check if user exists at all
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found in auth.users with ID: ' || user_id::text
    );
  END IF;
  
  -- Check if already confirmed
  SELECT (email_confirmed_at IS NOT NULL) INTO v_already_confirmed 
  FROM auth.users WHERE id = user_id;
  
  IF v_already_confirmed THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Email already confirmed',
      'user_id', user_id,
      'already_confirmed', true
    );
  END IF;

  -- Update the auth user to have proper confirmed email and metadata
  UPDATE auth.users 
  SET 
    email_confirmed_at = NOW(),
    confirmation_token = '',
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change = COALESCE(email_change, ''),
    raw_user_meta_data = CASE 
      WHEN raw_user_meta_data = '{}' OR raw_user_meta_data IS NULL 
      THEN '{"email_verified":true}'::jsonb
      ELSE raw_user_meta_data || '{"email_verified":true}'::jsonb
    END,
    updated_at = NOW()
  WHERE id = user_id
    AND email_confirmed_at IS NULL;  -- Only update if not already confirmed
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  IF v_updated THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Email confirmed automatically',
      'user_id', user_id,
      'confirmed_at', NOW()
    );
  ELSE
    -- Check again if it was confirmed by another process
    SELECT (email_confirmed_at IS NOT NULL) INTO v_already_confirmed 
    FROM auth.users WHERE id = user_id;
    
    IF v_already_confirmed THEN
      RETURN jsonb_build_object(
        'success', true,
        'message', 'Email was already confirmed (possibly by another process)',
        'user_id', user_id
      );
    ELSE
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Failed to confirm email - no rows updated',
        'user_id', user_id
      );
    END IF;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false, 
    'error', 'Email confirmation failed: ' || SQLERRM,
    'user_id', user_id
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.auto_confirm_user_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_confirm_user_email(UUID) TO anon;

DO $$
BEGIN
  RAISE NOTICE '✅ ENHANCED AUTO EMAIL CONFIRMATION FUNCTION UPDATED!';
  RAISE NOTICE '🔧 Better error handling and diagnostics added';
  RAISE NOTICE '🎯 Should now properly confirm emails and show detailed errors';
END $$;