# ⚠️ CRITICAL DATABASE UPDATE - Zero Balance Fix

## 🎯 **Important: You MUST run this SQL update**

The updated `create-user-profile-function.sql` contains the fix that sets new user balances to $0.00 instead of $1000.

## 📋 **Steps to Apply the Fix:**

### 1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to "SQL Editor"

### 2. **Run the Updated Function**
   Copy and paste the entire contents of `create-user-profile-function.sql` and execute it.

### 3. **Verify the Update**
   The function will show:
   ```sql
   balance,
   ...
   ) VALUES (
   ...
   0.00,  -- ⭐ This should be 0.00, not 1000.00
   ```

## 🧪 **Testing the Fix**

After deployment, test with a new user registration:

1. Register a new test account
2. Check the user's balance in the admin panel
3. **Expected Result:** Balance should be $0.00
4. **If still $1000:** Re-run the SQL function update

## 🔧 **What Changed**

**Before (Line 64):**
```sql
1000.00,  -- ❌ Users got $1000 automatically
```

**After (Line 64):**
```sql
0.00,     -- ✅ Users start with $0, admin adds funds manually
```

---
**This update gives you full control over user fund allocation!**