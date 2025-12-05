# Execute Withdrawal Transaction Trigger - Step-by-Step Guide

**Date:** 2025-10-08  
**LogID:** L0074  
**Your Supabase Project:** https://qghsyyyompjuxjtbqiuk.supabase.co

---

## Option 1: Execute via Supabase Dashboard (RECOMMENDED)

### Steps:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/qghsyyyompjuxjtbqiuk
   - Log in with your credentials

2. **Navigate to SQL Editor**
   - Click on the SQL Editor icon in the left sidebar (looks like `</>`)
   - Click "+ New Query"

3. **Copy and Execute the SQL**
   - Open the file: `database/create_withdrawal_transaction_trigger.sql`
   - Copy the ENTIRE contents
   - Paste into the SQL Editor
   - Click "RUN" button (or press Ctrl+Enter)

4. **Verify Success**
   - You should see output at the bottom showing:
     - Functions created
     - Triggers created
     - Success message: "Withdrawal transaction triggers created successfully!"

5. **Test the Trigger**
   - Create a test withdrawal through your app
   - Check the `transactions` table to see if a corresponding transaction record was created
   - Verify the transaction has `type = 'debit'` and proper description

---

## Option 2: Execute via psql (If you have PostgreSQL client)

```bash
# Set your connection string (ask for service role key if needed)
set PGPASSWORD=your_service_role_key_here
psql "postgresql://postgres:[SERVICE_ROLE_KEY]@db.qghsyyyompjuxjtbqiuk.supabase.co:5432/postgres" -f database/create_withdrawal_transaction_trigger.sql
```

---

## Option 3: Provide Service Role Key to Warp AI

If you have your **Supabase Service Role Key**, you can provide it to me and I can execute the trigger directly using psql or a SQL client.

**To find your Service Role Key:**
1. Go to: https://supabase.com/dashboard/project/qghsyyyompjuxjtbqiuk/settings/api
2. Under "Project API keys" section
3. Copy the **service_role** key (not the anon key)
4. Paste it here (I will handle it securely per your credential rules)

---

## What This Trigger Does:

✅ **Automatically creates transaction records** when withdrawals are created  
✅ **Syncs transaction status** when withdrawal status changes  
✅ **Links transactions to withdrawals** via `transaction_number`  
✅ **Generates proper descriptions** with withdrawal method and account details  

---

## Verification After Execution:

Run this query in Supabase SQL Editor to verify:

```sql
-- Check if functions were created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('create_transaction_from_withdrawal', 'update_transaction_from_withdrawal_status')
  AND routine_schema = 'public';

-- Check if triggers were created
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'withdrawals'
  AND trigger_name LIKE '%transaction%';
```

Expected output:
- 2 functions: `create_transaction_from_withdrawal` and `update_transaction_from_withdrawal_status`
- 2 triggers: `trigger_create_transaction_from_withdrawal` and `trigger_update_transaction_from_withdrawal_status`

---

## Next Steps After Execution:

Once the trigger is successfully executed:
1. ✅ Issue 5 (withdrawal transactions not appearing) will be FIXED for NEW withdrawals
2. ✅ Issue 6 (transaction history sync) will be FIXED
3. I will proceed to fix Issue 2 (add Past Transactions to dashboard)
4. I will proceed to fix Issue 4 (client name in admin withdrawal detail)

---

**Ready to proceed?** Let me know which option you prefer!
