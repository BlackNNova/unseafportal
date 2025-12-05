# Supabase Storage Setup for KYC Documents

## Overview

Your enhanced KYC management system requires proper Supabase Storage configuration to handle document uploads, viewing, and downloads securely. This guide will walk you through setting up the storage bucket and policies.

## 🎯 Project Information

- **Project URL**: https://supabase.com/dashboard/project/qghsyyyompjuxjtbqiuk
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaHN5eXlvbXBqdXhqdGJxaXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1ODg1MDMsImV4cCI6MjA3MzE2NDUwM30.NFI5KLZrnWq1yTN4R8nGV5dSKDy7DmvedAFmjNdbEGY`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaHN5eXlvbXBqdXhqdGJxaXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU4ODUwMywiZXhwIjoyMDczMTY0NTAzfQ.NVw73mYtHki57OelhZduFipUGaoD73ZJjaSyolHjJvM`

## 📋 Step-by-Step Setup

### Step 1: Create Storage Bucket

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/qghsyyyompjuxjtbqiuk
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Create a bucket with these settings:
   - **Name**: `kyc documents` (exactly as written, with space)
   - **Public**: ✅ **Enabled** (required for signed URLs)
   - **File size limit**: 10 MB (recommended)
   - **Allowed MIME types**: `image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### Step 2: Configure Bucket Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies:

1. Go to **Storage > Policies** tab
2. Click **"New policy"** for the `kyc documents` bucket
3. Create the following policies:

#### Policy 1: Users can upload their own KYC documents

```sql
-- Policy Name: "Users can insert own KYC documents"
-- Operation: INSERT
-- Target roles: authenticated

-- Policy definition:
(
  bucket_id = 'kyc documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
```

#### Policy 2: Authenticated users can view KYC documents (for admin access)

```sql
-- Policy Name: "Authenticated users can view KYC documents" 
-- Operation: SELECT
-- Target roles: authenticated

-- Policy definition:
(bucket_id = 'kyc documents' AND auth.role() = 'authenticated')
```

#### Policy 3: Users can update/delete their own documents

```sql
-- Policy Name: "Users can update own KYC documents"
-- Operation: UPDATE, DELETE  
-- Target roles: authenticated

-- Policy definition:
(
  bucket_id = 'kyc documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
```

### Step 3: Verify Storage Structure

The system expects files to be organized as follows:
```
kyc documents/
├── {user-uuid-1}/
│   ├── aml-certificate-2025-01-15-123456.pdf
│   └── aml-certificate-2025-01-20-789012.pdf
├── {user-uuid-2}/
│   └── aml-certificate-2025-01-16-345678.pdf
└── ...
```

This structure is automatically created by the KYCForm component when users upload documents.

## 🔧 Configuration Validation

### Test Storage Access

Run this in your browser console after logging in as an admin:

```javascript
// Test storage bucket access
import { supabase } from './utils/supabase.js';

// Test 1: List bucket contents (admin should see all)
const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
console.log('Available buckets:', buckets);

// Test 2: List files in kyc documents bucket
const { data: files, error: filesError } = await supabase.storage
  .from('kyc documents')
  .list('', { limit: 10 });
console.log('KYC files:', files);

// Test 3: Create a signed URL (replace with actual file path)
const { data: signedUrl, error: urlError } = await supabase.storage
  .from('kyc documents')  
  .createSignedUrl('some-user-id/test-document.pdf', 3600);
console.log('Signed URL:', signedUrl);
```

## ⚠️ Important Security Notes

### 1. Admin Access Control

The current policies allow all authenticated users to view KYC documents. For production, you should implement proper admin role checking:

```sql
-- Enhanced admin-only policy (recommended for production)
CREATE POLICY "Only admins can view KYC documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'kyc documents' AND 
  auth.jwt()->>'role' = 'admin'  -- Adjust based on your admin system
);
```

### 2. File Size and Type Restrictions

Set appropriate limits in your bucket configuration:
- **Max file size**: 10 MB (sufficient for PDF certificates)
- **Allowed types**: Only document types (PDF, images, Word docs)
- **Virus scanning**: Consider enabling Supabase's virus scanning feature

### 3. Audit Trail

All document access is logged through the audit system. Monitor these logs regularly:

```sql
-- Query recent document access
SELECT 
  al.timestamp,
  al.event_type,
  al.action,
  u.email as admin_email,
  target_u.email as user_email
FROM audit_logs al
JOIN auth.users u ON al.admin_id = u.id  
JOIN auth.users target_u ON al.user_id = target_u.id
WHERE al.event_type IN ('document_view', 'document_download')
ORDER BY al.timestamp DESC
LIMIT 50;
```

## 🧪 Testing Checklist

Before going live, verify:

- [ ] ✅ Storage bucket `kyc documents` exists and is public
- [ ] ✅ RLS policies are configured correctly
- [ ] ✅ Users can upload documents through KYCForm
- [ ] ✅ Admins can view documents in KYCManagement
- [ ] ✅ Document downloads work correctly
- [ ] ✅ Signed URLs generate successfully
- [ ] ✅ Audit logs capture document access
- [ ] ✅ File size limits are enforced
- [ ] ✅ Only allowed file types are accepted

## 🚨 Troubleshooting

### Problem: "Access denied" when viewing documents

**Solution**: Check your RLS policies and ensure the admin user has proper authentication.

```sql
-- Debug query to check user permissions
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role,
  auth.jwt() as token_claims;
```

### Problem: Documents not appearing in admin panel

**Solution**: Verify the file path structure and bucket permissions:

```javascript
// Debug storage contents
const { data, error } = await supabase.storage
  .from('kyc documents')
  .list('', { limit: 100, offset: 0 });
console.log('All files:', data);
```

### Problem: Signed URLs not working

**Solution**: Ensure bucket is public and policies allow SELECT:

```sql
-- Check bucket settings
SELECT * FROM storage.buckets WHERE id = 'kyc documents';

-- Verify SELECT policies exist
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname ILIKE '%kyc%';
```

## 📞 Support

If you encounter issues:

1. Check the Supabase dashboard logs
2. Verify your RLS policies match the examples above
3. Test with the validation scripts provided
4. Review the audit logs for error patterns

## 🎉 Ready to Deploy!

Once you've completed all steps and verified the tests pass, your storage is ready for the enhanced KYC management system. The system will automatically handle:

- ✅ Secure document uploads
- ✅ PDF and image viewing
- ✅ Audit-logged downloads
- ✅ Proper access control
- ✅ File organization and cleanup