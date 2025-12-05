-- ============================================================================
-- AUTO EMAIL CONFIRMATION FUNCTION - HYBRID APPROACH SOLUTION
-- ============================================================================
-- This function automatically confirms emails for users created through
-- normal Supabase registration, eliminating the need for manual SQL intervention

CREATE OR REPLACE FUNCTION public.auto_confirm_user_email(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated BOOLEAN := FALSE;
BEGIN
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
  WHERE id = user_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  IF v_updated THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Email confirmed automatically',
      'user_id', user_id
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'User not found or already confirmed'
    );
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false, 
    'error', SQLERRM
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.auto_confirm_user_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_confirm_user_email(UUID) TO anon;

DO $$
BEGIN
  RAISE NOTICE '✅ AUTO EMAIL CONFIRMATION FUNCTION CREATED!';
  RAISE NOTICE '🔧 This function fixes all auth fields to match working users';
  RAISE NOTICE '🎯 Ready for hybrid approach implementation';
END $$;