-- ===============================================
-- CRITICAL FIX: Enable User Deletion for Admins
-- ===============================================
-- 
-- PROBLEM: User deletion shows "success" but users aren't actually deleted
-- ROOT CAUSE: No DELETE policy exists on users table
-- 
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire script
-- 3. Click "Run" to execute
-- 4. Verify with the verification query at the bottom
--
-- ===============================================

-- Step 1: Drop any existing DELETE policies (cleanup)
DROP POLICY IF EXISTS "test_delete_policy" ON public.users;
DROP POLICY IF EXISTS "admin_delete_users" ON public.users;
DROP POLICY IF EXISTS "admin_can_delete_users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- Step 2: Create the proper DELETE policy for admins
CREATE POLICY "Admins can delete users"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.users admin_check
      WHERE admin_check.id = auth.uid()
      AND admin_check.is_admin = true
    )
  );

-- Step 3: Verification - Should return 1 row showing the new policy
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'users' 
AND cmd = 'DELETE';

-- Expected result:
-- policyname: "Admins can delete users"
-- cmd: "DELETE"
-- roles: {authenticated}
-- qual: EXISTS (SELECT 1... with is_admin check)

-- ===============================================
-- WHAT THIS FIXES:
-- ===============================================
-- Before: Frontend calls delete → RLS blocks it → No error shown → "Success" message appears
-- After:  Frontend calls delete → RLS allows if admin → User actually deleted → Success!
--
-- TESTED WITH:
-- - Foreign key CASCADE constraints (already applied in L0045)
-- - Admin authentication via auth.uid()
-- - is_admin = true check on users table
--
-- ===============================================
