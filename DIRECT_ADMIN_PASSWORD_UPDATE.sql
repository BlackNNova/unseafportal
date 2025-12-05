-- ===============================================
-- DIRECT ADMIN PASSWORD UPDATE
-- ===============================================
-- Run this in Supabase SQL Editor to update admin password
-- New Password: &#h&84K@
-- Date: 2025-09-30

-- Step 1: Find all users with admin-like emails
SELECT id, email, created_at, updated_at
FROM auth.users
WHERE email ILIKE '%admin%' 
   OR email ILIKE '%unseaf%'
ORDER BY created_at;

-- Step 2: Update the admin password
-- Replace 'ADMIN_EMAIL_HERE' with the actual admin email from Step 1

-- Using Supabase's crypt function for bcrypt hashing
UPDATE auth.users
SET 
  encrypted_password = crypt('&#h&84K@', gen_salt('bf')),
  updated_at = now()
WHERE email = 'ADMIN_EMAIL_HERE'; -- Replace with actual admin email

-- Step 3: Verify the update
SELECT 
  id, 
  email, 
  updated_at,
  created_at
FROM auth.users
WHERE email ILIKE '%admin%'
ORDER BY updated_at DESC;

-- ===============================================
-- ALTERNATIVE: If you know the admin user ID
-- ===============================================

-- Update by user ID instead of email
-- UPDATE auth.users
-- SET 
--   encrypted_password = crypt('&#h&84K@', gen_salt('bf')),
--   updated_at = now()
-- WHERE id = 'ADMIN_USER_ID_HERE';

-- ===============================================
-- TESTING
-- ===============================================
-- After running this:
-- 1. Go to: https://funding-unseaf.org/admin/login
-- 2. Enter admin email
-- 3. Enter password: &#h&84K@
-- 4. Verify successful login

-- ===============================================
-- NOTES
-- ===============================================
-- Password: &#h&84K@
-- Strength: Strong (special characters, numbers, letters)
-- Access: Sole admin only
