# Email Validation Error: "Email address is invalid"

## 🎯 **Root Cause Analysis**

The error `Email address "jadesmith@gmail.com" is invalid` is coming from **Supabase Auth**, not your application code. This typically happens due to:

### **1. Supabase Email Confirmation Settings**
- **Issue**: Supabase requires email confirmation but the email domain is flagged as invalid
- **Location**: Supabase Dashboard → Authentication → Settings → Email

### **2. Domain Restrictions**
- **Issue**: Gmail or other domains might be restricted in your Supabase project
- **Location**: Supabase Dashboard → Authentication → Settings → Email

### **3. Email Validation Rules**
- **Issue**: Supabase has strict email validation that rejects certain formats
- **Location**: Built into Supabase Auth service

## 🛠️ **SOLUTIONS (In Order of Preference)**

### **Solution 1: Check Supabase Auth Settings (RECOMMENDED)**

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/qghsyyyompjuxjtbqiuk
2. **Navigate to**: Authentication → Settings
3. **Check Email Tab**:
   - ✅ Ensure "Enable email confirmations" is set correctly
   - ✅ Check if there are domain restrictions
   - ✅ Look for "Allowed email domains" settings
   - ✅ Verify "Enable custom SMTP" settings if configured

### **Solution 2: Temporarily Disable Email Confirmation**

If email confirmation is causing issues:

1. **In Supabase Dashboard** → Authentication → Settings → Email
2. **Disable** "Enable email confirmations" temporarily
3. **Test registration** again
4. **Re-enable** after testing

### **Solution 3: Code-Level Email Validation Override**

Add email format validation in your code before sending to Supabase:

```javascript
// In RegisterPage.jsx, update validateForm function:
const validateForm = () => {
  // ... existing validations ...
  
  // Enhanced email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    setError('Please enter a valid email address');
    return false;
  }
  
  // Check for common problematic patterns
  if (formData.email.includes('..') || formData.email.startsWith('.') || formData.email.endsWith('.')) {
    setError('Email format is invalid');
    return false;
  }
  
  return true;
};
```

### **Solution 4: Use Alternative Email Format**

If the issue persists, try normalizing the email:

```javascript
// In supabase.js, modify the register function:
register: async (userData) => {
  // Normalize email before sending to Supabase
  const normalizedEmail = userData.email.toLowerCase().trim();
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: normalizedEmail,  // Use normalized email
    password: userData.password
  });
  
  // ... rest of code
}
```

### **Solution 5: Alternative Registration Approach**

If all else fails, use a different registration flow:

```javascript
// Create auth user with a temporary email, then update
register: async (userData) => {
  // Use a temporary internal email for auth
  const tempEmail = `temp-${Date.now()}@internal.unseaf.org`;
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: tempEmail,
    password: userData.password
  });
  
  // Then store the real email in the users table
  // ... rest of profile creation code with real email
}
```

## 🧪 **DIAGNOSTIC STEPS**

### **Step 1: Run SQL Diagnostic**
```sql
-- Run this in Supabase SQL Editor
SELECT 'jadesmith@gmail.com' ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' as is_valid_format;
```

### **Step 2: Test Different Email**
Try registering with:
- `test@example.com`
- `user@yourdomain.com` 
- `simple@test.io`

### **Step 3: Check Browser Console**
Look for additional error details in browser console during registration.

## 📞 **IMMEDIATE ACTION PLAN**

1. **First**: Check Supabase Auth settings for email restrictions
2. **Second**: Try with a different email format to confirm
3. **Third**: If confirmed as Supabase issue, implement Solution 4 (email normalization)
4. **Fourth**: If still failing, implement Solution 5 (alternative approach)

## 🔧 **Quick Test**

To quickly test if this is a Supabase config issue, try this in your browser console on the registration page:

```javascript
// Test direct Supabase auth call
supabase.auth.signUp({
  email: 'test@example.com',
  password: 'testpass123'
}).then(result => console.log('Test result:', result));
```

This will bypass your registration flow and test Supabase directly.