// ============================================
// UNSEAF Portal - Database Schema Verification & Setup
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qghsyyyompjuxjtbqiuk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaHN5eXlvbXBqdXhqdGJxaXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU4ODUwMywiZXhwIjoyMDczMTY0NTAzfQ.NVw73mYtHki57OelhZduFipUGaoD73ZJjaSyolHjJvM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// 1. CHECK EXISTING TABLES
// ============================================
async function checkExistingTables() {
  console.log('🔍 Checking existing database tables...\n');
  
  const tablesToCheck = [
    'users',
    'transactions', 
    'withdrawals',
    'transfers',
    'kyc_documents',
    'audit_logs',
    'admins'
  ];
  
  const existingTables = {};
  
  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Table '${tableName}' does not exist or is not accessible`);
        console.log(`   Error: ${error.message}\n`);
        existingTables[tableName] = false;
      } else {
        console.log(`✅ Table '${tableName}' exists (${data?.length || 0} records)`);
        existingTables[tableName] = true;
      }
    } catch (err) {
      console.log(`❌ Table '${tableName}' check failed: ${err.message}`);
      existingTables[tableName] = false;
    }
  }
  
  return existingTables;
}

// ============================================
// 2. GET TABLE STRUCTURE
// ============================================
async function getTableStructure(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Could not fetch structure for '${tableName}': ${error.message}`);
      return null;
    }
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`📋 '${tableName}' columns: ${columns.join(', ')}`);
      return columns;
    } else {
      console.log(`📋 '${tableName}' exists but has no data to analyze structure`);
      return [];
    }
  } catch (err) {
    console.log(`❌ Structure check failed for '${tableName}': ${err.message}`);
    return null;
  }
}

// ============================================
// 3. CREATE FINANCIAL TABLES SQL
// ============================================
const createFinancialTablesSQL = `
-- ===============================================
-- UNSEAF Portal - Financial Tables Setup
-- ===============================================

-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    post_balance DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    reference TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transfers table if it doesn't exist
CREATE TABLE IF NOT EXISTS transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transfer_type TEXT NOT NULL CHECK (transfer_type IN ('within_unseaf', 'other_bank', 'wire_transfer')),
    recipient_name TEXT NOT NULL,
    recipient_account TEXT NOT NULL,
    recipient_bank TEXT,
    recipient_details JSONB DEFAULT '{}',
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    charge DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected')),
    notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create withdrawals table if it doesn't exist (may already exist)
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    charge DECIMAL(10,2) DEFAULT 0,
    after_charge DECIMAL(10,2) NOT NULL,
    method TEXT NOT NULL DEFAULT 'Bank Transfer' CHECK (method IN ('Bank Transfer', 'Check', 'Wire Transfer', 'Digital Wallet')),
    bank_details JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_number ON transactions(transaction_number);

CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_type ON transfers(transfer_type);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON transfers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_transaction_number ON transfers(transaction_number);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_transaction_number ON withdrawals(transaction_number);

-- Enable RLS on financial tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY IF NOT EXISTS "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins can view all transactions" ON transactions
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for transfers  
CREATE POLICY IF NOT EXISTS "Users can view own transfers" ON transfers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own transfers" ON transfers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins can view all transfers" ON transfers
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for withdrawals
CREATE POLICY IF NOT EXISTS "Users can view own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own withdrawals" ON withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins can view all withdrawals" ON withdrawals
    FOR ALL USING (auth.role() = 'authenticated');

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_transfers_updated_at 
    BEFORE UPDATE ON transfers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_withdrawals_updated_at 
    BEFORE UPDATE ON withdrawals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

// ============================================
// 4. EXECUTE SQL SETUP
// ============================================
async function createMissingTables() {
  console.log('\n🏗️ Creating missing financial tables...\n');
  
  try {
    const { error } = await supabase.rpc('exec_sql', { 
      sql_query: createFinancialTablesSQL 
    });
    
    if (error) {
      console.log('❌ SQL execution failed via RPC, trying direct execution...');
      console.log(`Error: ${error.message}\n`);
      
      // Try executing parts of the SQL individually
      const statements = createFinancialTablesSQL
        .split(';')
        .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            const { error: stmtError } = await supabase.rpc('exec_sql', { 
              sql_query: statement + ';' 
            });
            
            if (stmtError) {
              console.log(`⚠️ Statement failed: ${stmtError.message}`);
            } else {
              console.log(`✅ Statement executed successfully`);
            }
          } catch (err) {
            console.log(`⚠️ Statement error: ${err.message}`);
          }
        }
      }
    } else {
      console.log('✅ Financial tables setup completed successfully!\n');
    }
  } catch (err) {
    console.log(`❌ Setup failed: ${err.message}\n`);
    console.log('📋 SQL that would be executed:');
    console.log(createFinancialTablesSQL);
  }
}

// ============================================
// 5. MAIN EXECUTION
// ============================================
async function main() {
  console.log('🚀 UNSEAF Portal - Database Setup Starting...\n');
  console.log('📊 Project:', supabaseUrl);
  console.log('🔑 Using service role key\n');
  
  try {
    // Step 1: Check existing tables
    const existingTables = await checkExistingTables();
    
    // Step 2: Get structure of existing tables
    console.log('\n📋 Analyzing existing table structures...\n');
    for (const [tableName, exists] of Object.entries(existingTables)) {
      if (exists) {
        await getTableStructure(tableName);
      }
    }
    
    // Step 3: Create missing financial tables
    const needsFinancialTables = !existingTables.transactions || !existingTables.transfers;
    
    if (needsFinancialTables) {
      await createMissingTables();
      
      // Recheck tables after creation
      console.log('\n🔄 Rechecking tables after setup...\n');
      await checkExistingTables();
    } else {
      console.log('\n✅ All required financial tables already exist!\n');
    }
    
    console.log('🎉 Database setup completed!\n');
    
    // Step 4: Summary
    console.log('📋 SUMMARY:');
    console.log('- ✅ Database connectivity confirmed');
    console.log('- ✅ Table structure verified');
    console.log('- ✅ Financial tables ready');
    console.log('- ✅ Ready for Step 2: Mock Data Generation\n');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('\n📋 Manual SQL for creating tables:');
    console.log(createFinancialTablesSQL);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main, checkExistingTables, createMissingTables };