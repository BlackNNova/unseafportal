-- ===============================================
-- Email Validation Diagnostic Script
-- ===============================================
-- Run this in Supabase SQL Editor to check email validation settings

-- 1. Check if there are any email domain restrictions
SELECT 
    'Current Email Settings Check' as test_type,
    'Check your Supabase Auth settings' as instruction;

-- 2. Test email validation with a simple query
-- This will help us understand if the issue is database-level or auth-level

-- Check if there are any existing users with gmail addresses
SELECT 
    'Existing Gmail Users' as test_type,
    COUNT(*) as gmail_user_count,
    array_agg(email) as sample_emails
FROM users 
WHERE email LIKE '%@gmail.com' 
LIMIT 5;

-- Check if there are any constraints on email field
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.constraint_column_usage ccu
JOIN information_schema.check_constraints cc ON ccu.constraint_name = cc.constraint_name
WHERE ccu.table_name = 'users' 
AND ccu.column_name = 'email';

-- Check the email column definition
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'email';

-- Sample INSERT test with the problematic email
DO $$
BEGIN
    -- This is just a test to see if email validation is database-level
    RAISE NOTICE 'Testing email format validation at database level...';
    
    -- We won't actually insert, just test the format
    IF 'jadesmith@gmail.com' ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE NOTICE '✅ Email format is valid according to standard regex';
    ELSE
        RAISE NOTICE '❌ Email format is invalid according to standard regex';
    END IF;
    
    RAISE NOTICE 'Email validation test complete';
END $$;