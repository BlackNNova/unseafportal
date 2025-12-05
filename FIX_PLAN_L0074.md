# FIX PLAN - L0074
**Date**: 2025-10-08  
**Issues Identified**: 6 critical problems requiring fixes

---

## **ISSUE 1: Dashboard Balance Not Updating After Withdrawal**

### Root Cause:
- WithdrawalPage fetches and shows updated balance ✅
- But user returns to Dashboard via "Go to Dashboard" button
- Dashboard does NOT automatically refetch balance on mount
- Dashboard only fetches on initial load (useEffect with empty dependency)

### Solution:
Add balance refetch when Dashboard component mounts/becomes visible

### Implementation Steps:
1. Add visibility detection or refetch on every mount
2. Or: Pass updated balance via navigation state
3. Or: Use global state management (Context/Redux)

**Chosen Approach**: Refetch on Dashboard mount always

---

## **ISSUE 2: Hard Refresh Required After Deployment**

### Root Cause:
- Browser caches JavaScript bundles aggressively
- No cache-busting mechanism in place
- Vite generates hashed filenames BUT index.html is cached
- Users see old code until manual hard refresh

### Solution:
Force cache invalidation on every deployment

### Implementation Steps:
1. Add meta tags to index.html to prevent caching
2. Add build timestamp/version to force new bundle names
3. Consider service worker with cache-first strategy
4. Add `Cache-Control` headers via .htaccess

**Chosen Approach**: Meta tags + versioned builds + .htaccess headers

---

## **ISSUE 3: Dollar Sign Overlaps Cursor in Amount Input**

### Root Cause:
- Input has `pl-10` (40px padding-left)
- DollarSign icon positioned `left-3` (12px from left)
- Icon width ~20px, so cursor starts at 40px
- But first digit appears where icon is (~12-32px)
- Visual overlap makes first digit hard to see

### Solution:
Increase left padding to `pl-12` or `pl-14`

### Implementation Steps:
1. Change `className="pl-10..."` to `className="pl-12..."`
2. Test visibility of first typed digit
3. Verify on different screen sizes

**Chosen Approach**: Change pl-10 to pl-12

---

## **ISSUE 4: Users Logged Out When Admin Changes KYC Status**

### Root Cause (needs verification):
- L0072 fix exists in source code
- But may not be deployed OR
- 5-minute interval still too aggressive OR
- Error in status check causes logout

### Solution:
1. Verify L0072 is deployed
2. If deployed, increase interval to 10 or 15 minutes
3. Add better error handling with retry logic
4. Only logout on explicit "rejected" or "suspended" status

### Implementation Steps:
1. Check if current deployment has L0072 changes
2. If not, rebuild and redeploy
3. If yes, increase interval and improve error handling
4. Add status change notification instead of immediate logout

**Chosen Approach**: Verify deployment, then improve error handling

---

## **ISSUE 5 & 6: Withdrawals Don't Create Transaction Records**

### Root Cause:
- WithdrawalPage creates record in `withdrawals` table ✅
- No database trigger to auto-create `transactions` record ❌
- No frontend code to insert into `transactions` table ❌
- Result: Transaction history page shows nothing

### Solution:
Add database trigger to auto-create transaction record

### Implementation Steps:
1. Create SQL trigger `create_transaction_from_withdrawal()`
2. Trigger fires AFTER INSERT on withdrawals table
3. Inserts into transactions table with:
   - transaction_number (same as withdrawal)
   - type: 'withdrawal'
   - amount: withdrawal amount (as negative/debit)
   - status: 'completed' or 'pending'
   - user_id: from withdrawal
   - reference: withdrawal transaction_number
4. Test trigger with sample withdrawal
5. Verify transaction appears in history

**Chosen Approach**: Database trigger (server-side, automatic, reliable)

---

## **EXECUTION ORDER**

1. ✅ **Issue 3** (Easiest) - Dollar sign padding fix
2. ✅ **Issue 1** - Dashboard balance refresh
3. ✅ **Issue 5 & 6** - Transaction records trigger (SQL file)
4. ✅ **Issue 2** - Cache busting (meta tags + headers)
5. ✅ **Issue 4** - Auth persistence verification/improvement
6. ✅ **Build & Test**
7. ✅ **Deploy & Verify**
8. ✅ **Log to PROJECT_LOG.md as L0074**

---

## **SUCCESS CRITERIA**

- [ ] Dashboard balance updates when returning from withdrawal
- [ ] Deployed changes visible immediately without hard refresh
- [ ] Dollar sign doesn't overlap first digit in amount input
- [ ] Users stay logged in when admin changes KYC (unless explicitly rejected)
- [ ] Withdrawals appear in transaction history
- [ ] All withdrawal methods tested and working
- [ ] Clean build with no errors
- [ ] deployment.zip created successfully

---

## **FILES TO MODIFY**

Frontend:
- `frontend/src/components/Dashboard.jsx` - Add balance refetch
- `frontend/src/components/withdrawals/WithdrawalPage.jsx` - Fix pl-10 to pl-12
- `frontend/public/index.html` - Add cache-busting meta tags
- `frontend/dist/.htaccess` - Add cache control headers
- `frontend/src/components/ProtectedRoute.jsx` - Verify/improve error handling

Backend:
- `database/create_transaction_trigger.sql` - New trigger for transaction records

---

**Next Action**: Begin fixing issues in order listed above
