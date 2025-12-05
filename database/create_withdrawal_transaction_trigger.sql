-- ===============================================
-- WITHDRAWAL TRANSACTION RECORD TRIGGER
-- ===============================================
-- Purpose: Automatically create transaction record when withdrawal is created
-- This ensures withdrawals appear in transaction history
-- Date: 2025-10-08
-- LogID: L0074

-- Step 1: Create function to generate transaction records from withdrawals
CREATE OR REPLACE FUNCTION create_transaction_from_withdrawal()
RETURNS TRIGGER AS $$
DECLARE
  trans_id TEXT;
BEGIN
  -- Generate transaction ID: TXN-YYYYMMDD-XXXXXX
  trans_id := 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Insert transaction record
  INSERT INTO transactions (
    transaction_id,
    transaction_number,
    user_id,
    type,
    amount,
    status,
    description,
    reference,
    post_balance,
    created_at
  ) VALUES (
    trans_id,
    NEW.transaction_number,  -- Same as withdrawal transaction_number
    NEW.user_id,
    'debit',  -- Withdrawal is a debit transaction
    NEW.amount,  -- Positive amount (transactions table handles sign via type)
    NEW.status,  -- pending, processing, or completed
    'Withdrawal: ' || NEW.method || ' - ' || COALESCE(NEW.method_details->>'accountHolderName', NEW.method_details->>'payeeName', 'Bank Account'),
    NEW.transaction_number,  -- Link back to withdrawal
    (SELECT current_balance FROM user_grants WHERE user_id = NEW.user_id),  -- Current balance after withdrawal trigger
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_transaction_from_withdrawal ON withdrawals;

-- Step 3: Create trigger to fire after withdrawal insert
CREATE TRIGGER trigger_create_transaction_from_withdrawal
  AFTER INSERT ON withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION create_transaction_from_withdrawal();

-- Step 4: Also update transaction status when withdrawal status changes
CREATE OR REPLACE FUNCTION update_transaction_from_withdrawal_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update corresponding transaction status when withdrawal status changes
  IF NEW.status != OLD.status THEN
    UPDATE transactions
    SET 
      status = NEW.status,
      updated_at = NOW()
    WHERE reference = NEW.transaction_number
      AND type = 'debit'
      AND user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Drop existing status update trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_transaction_from_withdrawal_status ON withdrawals;

-- Step 6: Create trigger for status updates
CREATE TRIGGER trigger_update_transaction_from_withdrawal_status
  AFTER UPDATE OF status ON withdrawals
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION update_transaction_from_withdrawal_status();

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================

-- Check if function was created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('create_transaction_from_withdrawal', 'update_transaction_from_withdrawal_status')
  AND routine_schema = 'public';

-- Check if triggers were created
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'withdrawals'
  AND trigger_name LIKE '%transaction%';

-- ===============================================
-- SUCCESS MESSAGE
-- ===============================================
SELECT 'Withdrawal transaction triggers created successfully!' AS status;
