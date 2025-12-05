-- ===============================================
-- UNSEAF Portal - Enhanced KYC Management Setup
-- ===============================================
-- Run these SQL commands in your Supabase SQL Editor
-- Project: https://supabase.com/dashboard/project/qghsyyyompjuxjtbqiuk

-- ===========================================
-- 1. ENSURE REQUIRED TABLES EXIST
-- ===========================================

-- Check if users table has all required KYC fields
-- (This should already exist, but we'll ensure KYC columns are present)
DO $$ 
BEGIN
    -- Add missing columns to users table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'kyc_status') THEN
        ALTER TABLE users ADD COLUMN kyc_status TEXT DEFAULT 'not_submitted';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE users ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- Ensure kyc_documents table exists with all required fields
CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL DEFAULT 'aml_certificate',
    file_path TEXT NOT NULL,
    original_filename TEXT,
    file_size INTEGER,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    grant_award_number TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 2. AUDIT LOGS TABLE (Optional but Recommended)
-- ===========================================

-- Create audit_logs table for comprehensive tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL, -- 'kyc_status_change', 'document_view', 'document_download', 'bulk_action'
    user_id UUID REFERENCES auth.users(id),
    admin_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    details JSONB,
    kyc_document_id UUID REFERENCES kyc_documents(id),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 3. INDEXES FOR PERFORMANCE
-- ===========================================

-- Indexes on users table for KYC filtering
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_grant_number ON users(grant_number);

-- Indexes on kyc_documents table
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_created_at ON kyc_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_reviewed_by ON kyc_documents(reviewed_by);

-- Indexes on audit_logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_kyc_document_id ON audit_logs(kyc_document_id);

-- ===========================================
-- 4. DATABASE FUNCTIONS
-- ===========================================

-- Function to generate account numbers (if not exists)
CREATE OR REPLACE FUNCTION generate_account_number(grant_num TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    account_num TEXT;
    counter INTEGER;
BEGIN
    -- Extract year from grant number (e.g., UNSEAF-2025/GR-0001 -> 2025)
    counter := COALESCE(
        (SELECT COUNT(*) + 1 FROM users WHERE grant_number LIKE SPLIT_PART(grant_num, '/', 1) || '%'),
        1
    );
    
    -- Generate account number: 2025001, 2025002, etc.
    account_num := EXTRACT(YEAR FROM NOW())::TEXT || LPAD(counter::TEXT, 3, '0');
    
    RETURN account_num;
END;
$$;

-- Function to update full_name when first_name or last_name changes
CREATE OR REPLACE FUNCTION update_full_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.full_name := TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update full_name
DROP TRIGGER IF EXISTS trigger_update_full_name ON users;
CREATE TRIGGER trigger_update_full_name
    BEFORE INSERT OR UPDATE OF first_name, last_name ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_full_name();

-- Trigger to update updated_at on kyc_documents
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_kyc_documents_updated_at ON kyc_documents;
CREATE TRIGGER trigger_kyc_documents_updated_at
    BEFORE UPDATE ON kyc_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ===========================================

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Allow users to see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow admin users to view all user profiles (you'll need to adjust this based on your admin identification)
-- For now, allowing all authenticated users to read (you should restrict this)
CREATE POLICY "Authenticated users can view users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- KYC Documents policies
-- Users can insert their own KYC documents
CREATE POLICY "Users can insert own KYC documents" ON kyc_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own KYC documents
CREATE POLICY "Users can view own KYC documents" ON kyc_documents
    FOR SELECT USING (auth.uid() = user_id);

-- Admin users can view all KYC documents (adjust based on your admin system)
CREATE POLICY "Authenticated users can view all KYC documents" ON kyc_documents
    FOR ALL USING (auth.role() = 'authenticated');

-- Audit logs policies
-- Only allow reading audit logs (no updates/deletes)
CREATE POLICY "Authenticated users can view audit logs" ON audit_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow inserting audit logs
CREATE POLICY "Authenticated users can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ===========================================
-- 6. UPDATE EXISTING DATA
-- ===========================================

-- Update existing users to have proper full_name
UPDATE users 
SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE full_name IS NULL OR full_name = '';

-- Set default KYC status for users who don't have one
UPDATE users 
SET kyc_status = 'not_submitted'
WHERE kyc_status IS NULL;

-- ===========================================
-- 7. SAMPLE DATA VALIDATION
-- ===========================================

-- Check setup
SELECT 
    'users' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN kyc_status = 'pending' THEN 1 END) as pending_kyc,
    COUNT(CASE WHEN kyc_status = 'approved' THEN 1 END) as approved_kyc,
    COUNT(CASE WHEN kyc_status = 'rejected' THEN 1 END) as rejected_kyc
FROM users
UNION ALL
SELECT 
    'kyc_documents' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_docs,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_docs,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_docs
FROM kyc_documents
UNION ALL
SELECT 
    'audit_logs' as table_name,
    COUNT(*) as total_records,
    0 as col2,
    0 as col3,
    0 as col4
FROM audit_logs;

-- ===========================================
-- SETUP COMPLETE! 🎉
-- ===========================================

-- Your enhanced KYC management system is now ready!
-- 
-- Next Steps:
-- 1. Configure Supabase Storage bucket policies (see SUPABASE_STORAGE_SETUP.md)
-- 2. Test the system with the provided test scripts
-- 3. Deploy your frontend application
--
-- Important Notes:
-- - Adjust RLS policies based on your admin user identification system
-- - Consider adding more specific admin role checks
-- - Monitor audit logs for security and compliance
-- - Set up regular backups of KYC documents and audit trails