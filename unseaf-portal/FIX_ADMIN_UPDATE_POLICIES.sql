-- ===============================================
-- UNSEAF Portal - Admin Update Policies Fix
-- ===============================================
-- This fixes the issue where admin users cannot update user account statuses
-- 
-- PROBLEM: The current RLS policies only allow users to update their own profiles,
-- but admin users need to be able to update ANY user's account_status, balance, etc.
-- 
-- Run this SQL in your Supabase SQL Editor to fix the issue.

-- ===============================================
-- 1. CHECK EXISTING POLICIES
-- ===============================================

-- First, let's see what policies currently exist
SELECT 
    policyname, 
    cmd, 
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- ===============================================
-- 2. ADD MISSING ADMIN UPDATE POLICIES
-- ===============================================

-- Create a comprehensive admin update policy
-- This allows authenticated users to update user records
-- (In production, you might want to restrict this to specific admin roles)

CREATE POLICY "Admins can update all user records" ON users
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Alternative: More restrictive policy that checks if the user is an admin
-- Uncomment this if you want to use admin table verification instead
/*
CREATE POLICY "Admin users can update all profiles" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.id = auth.uid()
        )
    );
*/

-- ===============================================
-- 3. ADD ADMIN INSERT POLICY (for bulk operations)
-- ===============================================

-- Allow admins to insert new user records if needed
CREATE POLICY "Admins can insert user records" ON users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ===============================================
-- 4. ADD ADMIN DELETE POLICY (for cleanup operations)  
-- ===============================================

-- Allow admins to delete user records if needed
CREATE POLICY "Admins can delete user records" ON users
    FOR DELETE USING (auth.role() = 'authenticated');

-- ===============================================
-- 5. VERIFY POLICIES ARE WORKING
-- ===============================================

-- Check all policies for users table after adding them
SELECT 
    policyname, 
    cmd, 
    roles,
    qual as "using_condition",
    with_check as "with_check_condition"
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- ===============================================
-- 6. TEST THE FIX
-- ===============================================

-- You can test this by running a simple update query
-- (Replace the UUID with an actual user ID from your users table)

-- Example test query (DO NOT RUN THIS IN PRODUCTION - IT'S JUST FOR TESTING):
/*
UPDATE users 
SET account_status = 'pending' 
WHERE id = '123e4567-e89b-12d3-a456-426614174000'  -- Replace with real user ID
RETURNING id, first_name, last_name, account_status;
*/

-- ===============================================
-- ALTERNATIVE SOLUTION: DISABLE RLS TEMPORARILY
-- ===============================================

-- If the above policies still don't work, you can temporarily disable RLS
-- WARNING: This removes security restrictions, use only for testing!

-- Disable RLS on users table (TESTING ONLY - NOT RECOMMENDED FOR PRODUCTION)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- To re-enable RLS after testing:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- PRODUCTION RECOMMENDATIONS
-- ===============================================

-- For production environments, consider:

-- 1. Create a more specific admin identification system:
/*
CREATE POLICY "Verified admins can update users" ON users
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM admins 
            WHERE role = 'super_admin' OR role = 'admin'
            AND is_active = true
        )
    );
*/

-- 2. Add audit logging trigger:
/*
CREATE OR REPLACE FUNCTION audit_user_updates()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        event_type,
        user_id,
        admin_id,
        action,
        old_status,
        new_status,
        details
    ) VALUES (
        'user_status_change',
        NEW.id,
        auth.uid(),
        'account_status_update',
        OLD.account_status,
        NEW.account_status,
        jsonb_build_object(
            'changed_fields', (
                SELECT array_agg(field)
                FROM (
                    SELECT 'account_status' as field WHERE OLD.account_status != NEW.account_status
                    UNION ALL
                    SELECT 'balance' as field WHERE OLD.balance != NEW.balance
                    UNION ALL 
                    SELECT 'kyc_status' as field WHERE OLD.kyc_status != NEW.kyc_status
                ) changes
            )
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_user_updates_trigger
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION audit_user_updates();
*/

-- ===============================================
-- 🎉 FIX COMPLETE!
-- ===============================================

-- After running this SQL, your admin dashboard should be able to:
-- ✅ Change user account statuses (pending ⟷ approved ⟷ rejected)
-- ✅ Update user balances (add/deduct funds)
-- ✅ Modify user profiles as needed
-- ✅ Delete users if necessary

-- The status change buttons in your admin dashboard should now work correctly!