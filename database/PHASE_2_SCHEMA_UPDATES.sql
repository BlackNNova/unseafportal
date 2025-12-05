-- ===============================================
-- PHASE 2: WITHDRAWAL SYSTEM - DATABASE SCHEMA UPDATES
-- ===============================================
-- Date: 2025-09-30
-- Purpose: Add columns for receipt storage, quarterly tracking, and enhanced withdrawal management

-- Step 1: Add new columns to withdrawals table
ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS receipt_html TEXT,
ADD COLUMN IF NOT EXISTS receipt_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS quarter_limit DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS quarter_used_before DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS quarter_remaining_after DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS processing_message TEXT;

-- Step 2: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_transaction_number ON withdrawals(transaction_number);
CREATE INDEX IF NOT EXISTS idx_withdrawals_quarter_period ON withdrawals(quarter_period);

-- Step 3: Update withdrawals table constraints (if needed)
-- Ensure method values are correct
ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_method_check;
ALTER TABLE withdrawals ADD CONSTRAINT withdrawals_method_check 
  CHECK (method IN ('bank_transfer', 'wire_transfer', 'digital_wallet', 'check'));

-- Ensure status values are correct
ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_status_check;
ALTER TABLE withdrawals ADD CONSTRAINT withdrawals_status_check 
  CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Step 4: Create function to generate transaction numbers
CREATE OR REPLACE FUNCTION generate_withdrawal_transaction_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  timestamp_part TEXT;
BEGIN
  -- Generate timestamp-based unique number
  timestamp_part := TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
  new_number := 'UNSEAF-WTH-' || timestamp_part || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to auto-generate transaction numbers
CREATE OR REPLACE FUNCTION set_withdrawal_transaction_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_number IS NULL THEN
    NEW.transaction_number := generate_withdrawal_transaction_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_withdrawal_transaction_number ON withdrawals;
CREATE TRIGGER trigger_set_withdrawal_transaction_number
  BEFORE INSERT ON withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION set_withdrawal_transaction_number();

-- Step 6: Create function to update user_grants quarterly usage
CREATE OR REPLACE FUNCTION update_quarterly_usage()
RETURNS TRIGGER AS $$
DECLARE
  quarter_column TEXT;
  current_quarter TEXT;
BEGIN
  -- Extract quarter from quarter_period (e.g., 'Q1-2025' -> 'Q1')
  current_quarter := SPLIT_PART(NEW.quarter_period, '-', 1);
  
  -- Determine which quarter column to update
  quarter_column := CASE current_quarter
    WHEN 'Q1' THEN 'q1_used'
    WHEN 'Q2' THEN 'q2_used'
    WHEN 'Q3' THEN 'q3_used'
    WHEN 'Q4' THEN 'q4_used'
    ELSE NULL
  END;
  
  -- Update the appropriate quarter column in user_grants
  IF quarter_column IS NOT NULL AND NEW.status = 'completed' THEN
    EXECUTE format('
      UPDATE user_grants 
      SET %I = COALESCE(%I, 0) + $1,
          current_balance = current_balance - $1,
          updated_at = NOW()
      WHERE user_id = $2
    ', quarter_column, quarter_column)
    USING NEW.amount, NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_quarterly_usage ON withdrawals;
CREATE TRIGGER trigger_update_quarterly_usage
  AFTER UPDATE OF status ON withdrawals
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION update_quarterly_usage();

-- Step 7: Add RLS policies for withdrawals (if not exists)
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawals
DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
CREATE POLICY "Users can view own withdrawals" ON withdrawals
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own withdrawals
DROP POLICY IF EXISTS "Users can create own withdrawals" ON withdrawals;
CREATE POLICY "Users can create own withdrawals" ON withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all withdrawals
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawals;
CREATE POLICY "Admins can view all withdrawals" ON withdrawals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  );

-- Admins can update all withdrawals
DROP POLICY IF EXISTS "Admins can update all withdrawals" ON withdrawals;
CREATE POLICY "Admins can update all withdrawals" ON withdrawals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  );

-- Step 8: Create view for admin withdrawal management
CREATE OR REPLACE VIEW admin_withdrawals_view AS
SELECT 
  w.id,
  w.transaction_number,
  w.user_id,
  u.email as user_email,
  u.first_name || ' ' || u.last_name as user_name,
  w.amount,
  w.fee,
  w.net_amount,
  w.method,
  w.status,
  w.quarter_period,
  w.created_at,
  w.updated_at,
  w.expected_completion_date,
  w.completed_at,
  ug.grant_title,
  ug.total_grant_amount,
  ug.current_balance
FROM withdrawals w
JOIN auth.users u ON w.user_id = u.id
LEFT JOIN user_grants ug ON w.user_id = ug.user_id
ORDER BY w.created_at DESC;

-- Step 9: Verify schema updates
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'withdrawals'
ORDER BY ordinal_position;

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================

-- Check if all new columns exist
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'withdrawals' 
  AND column_name = 'receipt_html'
) as receipt_html_exists;

-- Check if indexes were created
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'withdrawals';

-- Check if triggers were created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'withdrawals';

-- ===============================================
-- SUCCESS MESSAGE
-- ===============================================
SELECT 'Phase 2 database schema updates completed successfully!' as status;
