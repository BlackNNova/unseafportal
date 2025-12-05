#!/usr/bin/env node

/**
 * Execute Withdrawal Transaction Trigger
 * Date: 2025-10-08
 * LogID: L0074
 * 
 * This script executes the SQL trigger that automatically creates
 * transaction records from withdrawal records.
 */

const fs = require('fs');
const https = require('https');

// Supabase connection details from PROJECT_LOG.md L0004
const SUPABASE_URL = 'https://qghsyyyompjuxjtbqiuk.supabase.co';
const SUPABASE_KEY = 'sbp_7abffd8ecc76a3bdad1c69db8c6e2a70aa3202c5'; // From L0033

// Read the SQL file
const sqlFilePath = './create_withdrawal_transaction_trigger.sql';
console.log('📄 Reading SQL file:', sqlFilePath);
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Remove comments and split into individual statements
const statements = sqlContent
  .split('\n')
  .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
  .join('\n')
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`✅ Parsed ${statements.length} SQL statements\n`);

// Execute SQL using Supabase REST API
async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'qghsyyyompjuxjtbqiuk.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data, statusCode: res.statusCode });
        } else {
          reject({ success: false, error: data, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject({ success: false, error: error.message });
    });

    req.write(postData);
    req.end();
  });
}

// Alternative: Use pg library if available
async function executeWithPg() {
  try {
    const { Client } = require('pg');
    
    const client = new Client({
      host: 'db.qghsyyyompjuxjtbqiuk.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: SUPABASE_KEY,
      ssl: { rejectUnauthorized: false }
    });

    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected!\n');

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.trim() === '' || stmt.startsWith('SELECT \'Withdrawal')) continue;
      
      console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
      console.log(`   ${stmt.substring(0, 60)}...`);
      
      try {
        await client.query(stmt);
        console.log('   ✅ Success\n');
      } catch (err) {
        console.error('   ❌ Error:', err.message);
        if (!stmt.includes('DROP TRIGGER IF EXISTS')) {
          throw err;
        }
      }
    }

    // Verification queries
    console.log('\n🔍 Verifying installation...\n');
    
    const functionsResult = await client.query(`
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_name IN ('create_transaction_from_withdrawal', 'update_transaction_from_withdrawal_status')
        AND routine_schema = 'public'
    `);
    
    console.log('✅ Functions created:');
    functionsResult.rows.forEach(row => {
      console.log(`   - ${row.routine_name} (${row.routine_type})`);
    });

    const triggersResult = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers
      WHERE event_object_table = 'withdrawals'
        AND trigger_name LIKE '%transaction%'
    `);
    
    console.log('\n✅ Triggers created:');
    triggersResult.rows.forEach(row => {
      console.log(`   - ${row.trigger_name} (${row.event_manipulation} on ${row.event_object_table})`);
    });

    await client.end();
    
    console.log('\n🎉 SUCCESS! Withdrawal transaction triggers installed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Create a new withdrawal through the app');
    console.log('   2. Check the transactions table for a corresponding debit record');
    console.log('   3. Verify the transaction has proper description and status');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Fallback: Execute manually via Supabase Dashboard');
    console.error('   See: database/EXECUTE_TRIGGER_GUIDE.md');
    process.exit(1);
  }
}

// Run the script
console.log('🚀 Starting trigger execution...\n');
executeWithPg();
