-- ============================================================
-- WITHDRAWAL DATABASE FIX
-- Fixes L0066, L0067, L0068 issues from Sept 30
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- L0066 FIX: Add method_details JSONB column
-- ============================================================
ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS method_details JSONB;

COMMENT ON COLUMN withdrawals.method_details IS 'Stores all withdrawal method details as JSON (bank info, wallet info, etc.)';


-- ============================================================
-- L0067 FIX: Fix transaction_number trigger
-- ============================================================

-- Drop old broken trigger and function if they exist
DROP TRIGGER IF EXISTS withdrawals_auto_id ON withdrawals;
DROP FUNCTION IF EXISTS auto_generate_withdrawal_id();

-- Create new function for transaction_number generation
CREATE OR REPLACE FUNCTION auto_generate_transaction_number()
RETURNS TRIGGER AS $$
DECLARE
  new_number TEXT;
  date_part TEXT;
  sequence_part INTEGER;
BEGIN
  -- Only generate if transaction_number is not already set
  IF NEW.transaction_number IS NULL THEN
    -- Get date part (YYYYMMDD)
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- Get next sequence number for today
    SELECT COALESCE(MAX(
      CASE 
        WHEN transaction_number ~ '^WD-[0-9]{8}-[0-9]{5}$' 
        THEN CAST(SUBSTRING(transaction_number FROM 13 FOR 5) AS INTEGER)
        ELSE 0
      END
    ), 0) + 1
    INTO sequence_part
    FROM withdrawals
    WHERE transaction_number LIKE 'WD-' || date_part || '-%';
    
    -- Format: WD-YYYYMMDD-XXXXX (e.g., WD-20251008-00001)
    new_number := 'WD-' || date_part || '-' || LPAD(sequence_part::TEXT, 5, '0');
    
    NEW.transaction_number := new_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS withdrawals_auto_transaction_number ON withdrawals;
CREATE TRIGGER withdrawals_auto_transaction_number
  BEFORE INSERT ON withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_transaction_number();


-- ============================================================
-- L0068 FIX: Remove NOT NULL constraints from legacy columns
-- ============================================================

-- These old columns are no longer used (replaced by method_details JSONB)
-- but they had NOT NULL constraints that cause failures

ALTER TABLE withdrawals 
ALTER COLUMN bank_name DROP NOT NULL;

ALTER TABLE withdrawals 
ALTER COLUMN account_number DROP NOT NULL;

ALTER TABLE withdrawals 
ALTER COLUMN account_name DROP NOT NULL;

COMMENT ON COLUMN withdrawals.bank_name IS 'DEPRECATED: Use method_details.bankName instead';
COMMENT ON COLUMN withdrawals.account_number IS 'DEPRECATED: Use method_details.accountNumber instead';
COMMENT ON COLUMN withdrawals.account_name IS 'DEPRECATED: Use method_details.accountHolderName instead';


-- ============================================================
-- TRANSACTIONS TABLE FIX
-- The trigger tries to insert into transactions table
-- but that table is missing the transaction_number column
-- ============================================================

-- Check if transactions table exists and what columns it has
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') THEN
    -- Add transaction_number column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND column_name = 'transaction_number'
    ) THEN
      ALTER TABLE transactions ADD COLUMN transaction_number TEXT;
      RAISE NOTICE '✅ Added transaction_number column to transactions table';
    ELSE
      RAISE NOTICE 'ℹ️  transaction_number column already exists in transactions table';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  transactions table does not exist - will be created by trigger';
  END IF;
END $$;

-- Add index on transaction_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_number 
ON transactions(transaction_number);


-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check if method_details column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'withdrawals' 
AND column_name = 'method_details';

-- Check if transaction_number trigger exists
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'withdrawals_auto_transaction_number';

-- Check NOT NULL constraints on legacy columns
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'withdrawals' 
AND column_name IN ('bank_name', 'account_number', 'account_name');

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Withdrawal database fixes applied successfully!';
  RAISE NOTICE '✅ L0066: method_details column added';
  RAISE NOTICE '✅ L0067: transaction_number trigger fixed';
  RAISE NOTICE '✅ L0068: Legacy columns made nullable';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 You can now test withdrawals - they should work!';
END $$;
