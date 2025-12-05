-- ============================================================================
-- DIAGNOSTIC TEST: Test the bypass function directly
-- ============================================================================
-- This will help us see exactly what's failing inside the bypass function

SELECT public.register_user_bypass_auth_validation(
  'USA',                    -- p_country (alphabetical 1st)
  'jadesmith@gmail.com',    -- p_email (alphabetical 2nd)
  'Jade',                   -- p_first_name (alphabetical 3rd)
  'UNSEAF-2025/GR-1234',   -- p_grant_number (alphabetical 4th)
  'Smith',                  -- p_last_name (alphabetical 5th)
  '+1234567890',           -- p_mobile (alphabetical 6th)
  'testpassword123'        -- p_password (alphabetical 7th)
) AS result;