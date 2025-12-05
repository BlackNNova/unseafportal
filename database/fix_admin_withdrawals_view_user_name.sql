-- ===============================================
-- FIX ADMIN WITHDRAWALS VIEW - ADD CLIENT NAME
-- ===============================================
-- Purpose: Update admin_withdrawals_view to pull user name from public.users table
-- This fixes Issue #4 where client name doesn't appear in admin withdrawal detail modal
-- Date: 2025-10-08
-- LogID: L0076

-- Drop and recreate the view with corrected user name source
CREATE OR REPLACE VIEW admin_withdrawals_view AS
SELECT 
  w.id,
  w.transaction_number,
  w.user_id,
  au.email as user_email,
  COALESCE(
    pu.first_name || ' ' || pu.last_name,
    au.raw_user_meta_data->>'first_name' || ' ' || au.raw_user_meta_data->>'last_name',
    au.email
  ) as user_name,
  w.amount,
  w.fee,
  w.net_amount,
  w.method,
  w.method_details,
  w.status,
  w.quarter_period,
  w.processing_message,
  w.created_at,
  w.updated_at,
  w.expected_completion_date,
  w.completed_at,
  ug.grant_title,
  ug.grant_number,
  ug.total_grant_amount,
  ug.current_balance
FROM withdrawals w
JOIN auth.users au ON w.user_id = au.id
LEFT JOIN public.users pu ON w.user_id = pu.id
LEFT JOIN user_grants ug ON w.user_id = ug.user_id
ORDER BY w.created_at DESC;

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================

-- Check if view was updated
SELECT 
  viewname,
  definition
FROM pg_views
WHERE viewname = 'admin_withdrawals_view'
  AND schemaname = 'public';

-- Test query to verify user_name appears
SELECT 
  transaction_number,
  user_name,
  user_email,
  amount,
  status
FROM admin_withdrawals_view
LIMIT 5;

-- ===============================================
-- SUCCESS MESSAGE
-- ===============================================
SELECT 'Admin withdrawals view updated successfully with client names!' as status;
