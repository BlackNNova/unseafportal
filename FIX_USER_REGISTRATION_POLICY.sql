-- ===============================================
-- UNSEAF Portal - Fix User Registration Policy
-- ===============================================
-- 
-- PROBLEM: New user registration fails with:
-- "new row violates row-level security policy for table 'users'"
--
-- CAUSE: Missing INSERT policy for users table
-- 
-- SOLUTION: Add INSERT policy to allow new users to create their profiles
-- 
-- HOW TO RUN:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/qghsyyyompjuxjtbqiuk
-- 2. Click on "SQL Editor" in the sidebar
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- ===============================================

-- First, let's check the current policies on the users table
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Display current policy status
DO $$
BEGIN
    RAISE NOTICE '🔍 CHECKING CURRENT POLICIES ON USERS TABLE...';
    RAISE NOTICE 'If you see policies above, they are currently active.';
    RAISE NOTICE 'We will now add the missing INSERT policy for user registration.';
END $$;

-- ===============================================
-- ADD THE MISSING INSERT POLICY
-- ===============================================

-- Check if the INSERT policy already exists (safety check)
DO $$
BEGIN
    -- Check if policy already exists
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can insert own profile'
        AND cmd = 'INSERT'
    ) THEN
        RAISE NOTICE '✅ INSERT policy already exists! Skipping creation.';
    ELSE
        -- Create the missing INSERT policy
        EXECUTE 'CREATE POLICY "Users can insert own profile" ON users
                 FOR INSERT WITH CHECK (auth.uid() = id)';
        
        RAISE NOTICE '🎉 SUCCESS: INSERT policy created successfully!';
        RAISE NOTICE 'Policy Details:';
        RAISE NOTICE '- Name: "Users can insert own profile"';
        RAISE NOTICE '- Operation: INSERT (for new registrations)';
        RAISE NOTICE '- Security: Users can only insert their own profile (auth.uid() = id)';
    END IF;
END $$;

-- ===============================================
-- VERIFY THE FIX
-- ===============================================

-- Display all policies after the fix
RAISE NOTICE '📋 FINAL POLICY STATUS FOR USERS TABLE:';

SELECT 
    policyname as "Policy Name",
    cmd as "Operation", 
    CASE 
        WHEN cmd = 'SELECT' THEN 'Allows viewing profiles'
        WHEN cmd = 'UPDATE' THEN 'Allows updating own profile' 
        WHEN cmd = 'INSERT' THEN '🆕 Allows user registration'
        WHEN cmd = 'DELETE' THEN 'Allows deleting profiles'
        ELSE 'Other operation'
    END as "Purpose",
    with_check as "Security Check"
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY 
    CASE cmd 
        WHEN 'INSERT' THEN 1
        WHEN 'SELECT' THEN 2  
        WHEN 'UPDATE' THEN 3
        WHEN 'DELETE' THEN 4
        ELSE 5
    END,
    policyname;

-- ===============================================
-- TEST THE POLICY (Optional - for verification)
-- ===============================================

-- This query will help you verify the policies are working
-- You can run this to see if the INSERT policy is active
SELECT 
    CASE 
        WHEN COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) > 0 THEN '✅ REGISTRATION FIXED'
        ELSE '❌ STILL MISSING INSERT POLICY'
    END as "Registration Status",
    COUNT(*) as "Total Policies",
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as "SELECT Policies",
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as "UPDATE Policies", 
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as "INSERT Policies",
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as "DELETE Policies"
FROM pg_policies 
WHERE tablename = 'users';

-- ===============================================
-- FINAL MESSAGE
-- ===============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 REGISTRATION FIX COMPLETE! 🎉';
    RAISE NOTICE '';
    RAISE NOTICE '✅ What was fixed:';
    RAISE NOTICE '   - Added INSERT policy for user registration';
    RAISE NOTICE '   - Users can now create accounts successfully';
    RAISE NOTICE '   - Security maintained (users can only insert their own profile)';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 How to test:';
    RAISE NOTICE '   1. Go to your website registration page';
    RAISE NOTICE '   2. Try creating a new account';
    RAISE NOTICE '   3. Registration should now work without RLS errors';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Security Notes:';
    RAISE NOTICE '   - New policy only allows users to insert their own profile';
    RAISE NOTICE '   - Prevents unauthorized profile creation';
    RAISE NOTICE '   - Maintains data integrity and security';
    RAISE NOTICE '';
    RAISE NOTICE '💡 If you still get errors, check:';
    RAISE NOTICE '   - Supabase project URL and keys are correct';
    RAISE NOTICE '   - auth.users table has the required fields';
    RAISE NOTICE '   - Network connectivity to Supabase';
    RAISE NOTICE '';
END $$;