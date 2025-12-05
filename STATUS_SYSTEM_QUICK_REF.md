# STATUS SYSTEM - QUICK REFERENCE

**⚠️ WORKING SYSTEM - DO NOT MODIFY WITHOUT READING FULL DOCUMENTATION**

See `WITHDRAWAL_PAYMENT_STATUS_SYSTEM.md` for complete details.

---

## ✅ WHAT'S WORKING (2025-10-31)

**Admin Dashboard:**
- ✅ Change withdrawal statuses (all transitions)
- ✅ Change payment statuses (all transitions)
- ✅ No errors, no RLS blocks

**Database:**
- ✅ Withdrawals ↔ Transactions auto-sync
- ✅ Triggers working with SECURITY DEFINER
- ✅ RLS policies allow admin updates

**User UI:**
- ✅ All pages show consistent status
- ✅ No hardcoded values
- ✅ Status displays correctly everywhere

---

## 🚨 CRITICAL RULES

### NEVER DO THESE:

1. ❌ **NEVER** use `.single()` in status update queries
2. ❌ **NEVER** remove `SECURITY DEFINER` from trigger functions
3. ❌ **NEVER** change `WITH CHECK (true)` in admin RLS policies
4. ❌ **NEVER** disable or delete the sync triggers
5. ❌ **NEVER** hardcode status values in UI components

### ALWAYS DO THESE:

1. ✅ **ALWAYS** test status changes after any modification
2. ✅ **ALWAYS** verify RLS policies after database changes
3. ✅ **ALWAYS** check trigger status after migrations
4. ✅ **ALWAYS** read full documentation before changing anything
5. ✅ **ALWAYS** test with denniskitavi@gmail.com account

---

## 📋 CRITICAL COMPONENTS

### RLS Policy (Withdrawals)
```sql
CREATE POLICY admins_can_update_all_withdrawals ON withdrawals
  FOR UPDATE TO public
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()))
  WITH CHECK (true);  -- CRITICAL: Must be true!
```

### RLS Policy (Payments)
```sql
CREATE POLICY admins_can_update_all_project_payments ON project_payments
  FOR UPDATE TO public
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()))
  WITH CHECK (true);  -- CRITICAL: Must be true!
```

### Trigger Function (Must have SECURITY DEFINER)
```sql
CREATE OR REPLACE FUNCTION update_transaction_from_withdrawal_status()
RETURNS TRIGGER
SECURITY DEFINER  -- CRITICAL: Must be present!
SET search_path = public
LANGUAGE plpgsql
AS $$ ... $$;
```

### Frontend Update Function (NO .single()!)
```javascript
// ✅ CORRECT
const { error } = await supabase
  .from('withdrawals')
  .update(updates)
  .eq('id', withdrawalId);

// ❌ WRONG - DO NOT DO THIS
const { data, error } = await supabase
  .from('withdrawals')
  .update(updates)
  .eq('id', withdrawalId)
  .select()
  .single();  // CAUSES "Cannot coerce to single JSON object" ERROR
```

---

## 🔍 QUICK VERIFICATION

### Check RLS Policies
```sql
SELECT policyname, with_check 
FROM pg_policies 
WHERE tablename = 'withdrawals' 
  AND policyname LIKE '%admin%' 
  AND cmd = 'UPDATE';
-- Must show: with_check = 'true'
```

### Check Triggers
```sql
SELECT tgname, tgenabled, p.prosecdef
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'withdrawals'::regclass
  AND tgname LIKE '%status%';
-- Must show: tgenabled = 'O' and prosecdef = true
```

### Check Data Sync
```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN w.status = t.status THEN 1 ELSE 0 END) as synced
FROM withdrawals w
JOIN transactions t ON w.transaction_number = t.transaction_number;
-- synced should equal total
```

---

## 🧪 TEST PROCEDURE

**Before any deployment:**

1. Test withdrawal status changes:
   - pending → processing ✅
   - processing → completed ✅
   - processing → failed ✅

2. Test payment status changes:
   - pending → processing ✅
   - processing → completed ✅
   - processing → failed ✅

3. Verify on all pages:
   - Withdrawal History ✅
   - Dashboard ✅
   - Transactions Page ✅
   - Admin Financial Activity ✅

4. Check database sync:
   - Run verification SQL above ✅

**Test Account:** denniskitavi@gmail.com

---

## 🆘 COMMON ISSUES

### "new row violates row-level security policy"
**Fix:** RLS policy needs `WITH CHECK (true)`

### "Cannot coerce the result to a single JSON object"
**Fix:** Remove `.single()` from update query

### Status shows differently on different pages
**Fix:** Check if triggers are enabled and have SECURITY DEFINER

### Changes don't sync between tables
**Fix:** Verify trigger functions exist and are enabled

---

## 📞 NEED HELP?

1. Read `WITHDRAWAL_PAYMENT_STATUS_SYSTEM.md` (full documentation)
2. Check `PROJECT_LOG.md` entries L0029-L0036
3. Run verification SQL commands above
4. Test with denniskitavi@gmail.com account

---

**Last Updated:** 2025-10-31 16:26 UTC  
**Status:** ✅ FULLY WORKING  
**Version:** 1.0 BASELINE
