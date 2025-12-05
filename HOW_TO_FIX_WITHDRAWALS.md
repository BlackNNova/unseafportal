# How to Fix Withdrawal "Verifying..." Issue

## 🛑 Problem Summary

**Symptom**: When you click "Confirm Transaction" after entering your PIN, it shows "Verifying..." and then nothing happens.

**Root Cause**: The database is missing required columns and triggers that were created on September 30 (entries L0066-L0069 in PROJECT_LOG.md).

**Console Error**: 
```
code: "42703"
message: "column \"transaction_number\" of relation \"transactions\" does not exist"
```

---

## ✅ The Fix

You need to run **FIX_WITHDRAWAL_DATABASE.sql** in your Supabase database.

### Step-by-Step Instructions:

#### 1. Open Supabase SQL Editor
   - Go to: https://supabase.com/dashboard/project/qghsyyyompjuxjtbqiuk/sql
   - Click **"New query"** button (top right)

#### 2. Copy the SQL Script
   - Open `FIX_WITHDRAWAL_DATABASE.sql` (in your project root)
   - Select ALL content (Ctrl+A)
   - Copy it (Ctrl+C)

#### 3. Paste and Run
   - Paste into Supabase SQL Editor (Ctrl+V)
   - Click **"Run"** button (bottom right)
   - Wait for execution to complete

#### 4. Verify Success
   You should see these success messages:
   ```
   ✅ Withdrawal database fixes applied successfully!
   ✅ L0066: method_details column added
   ✅ L0067: transaction_number trigger fixed
   ✅ L0068: Legacy columns made nullable
   ✅ Added transaction_number column to transactions table
   🎯 You can now test withdrawals - they should work!
   ```

#### 5. Test Withdrawal
   - Go back to your funding-unseaf.org site
   - Refresh the page (Ctrl+Shift+R to clear cache)
   - Try the withdrawal process again
   - Enter PIN and click "Confirm Transaction"
   - **It should now advance to the success screen!**

---

## 📋 What the Script Does

### Fix #1: Adds `method_details` column (L0066)
- Your code stores bank/wallet details as JSON in `method_details`
- Without this column, INSERT fails

### Fix #2: Fixes `transaction_number` trigger (L0067)
- Auto-generates transaction numbers like "WD-20251008-00001"
- Old trigger was broken and referenced wrong field name

### Fix #3: Makes legacy columns nullable (L0068)
- Old columns (`bank_name`, `account_number`, `account_name`) had NOT NULL constraints
- New code doesn't use them anymore
- Without this fix, INSERT fails with constraint violation

### Fix #4: Adds `transaction_number` to transactions table (NEW)
- A database trigger automatically creates transaction records
- But the `transactions` table was missing the `transaction_number` column
- This was causing the error you saw

---

## 🔍 Why This Happened

On **September 30**, these database changes were made and tested. They worked!

But at some point, either:
1. The database was reset/restored without these changes, OR
2. You're testing on a different database than the one that was fixed

The **frontend code** was deployed with the changes, but the **database schema** wasn't updated to match.

---

## ⚠️ Important Notes

- **Run the ENTIRE script** - don't run it piece by piece
- The script is **safe to run multiple times** (uses `IF NOT EXISTS` checks)
- After running, **withdrawals should work immediately** - no need to redeploy code
- If you still get errors after running this, check the browser console again and let me know the NEW error

---

## 📞 If You Need Help

If the fix doesn't work:
1. Take a screenshot of the Supabase SQL Editor showing the results
2. Try the withdrawal again
3. Open browser console (F12) and screenshot any new errors
4. Share both screenshots

---

## ✨ Expected Result After Fix

1. ✅ Enter withdrawal amount → Works
2. ✅ Select method → Works
3. ✅ Fill details → Works
4. ✅ Enter PIN → Works
5. ✅ Click "Confirm Transaction" → **NOW WORKS!**
6. ✅ See success screen with transaction number
7. ✅ Balance updates automatically
8. ✅ Transaction appears in history
