/**
 * Apply Withdrawal Database Fixes
 * Connects directly to Supabase PostgreSQL and applies schema changes
 * 
 * Usage:
 *   Set environment variable SUPABASE_DB_URL with your connection string:
 *   $env:SUPABASE_DB_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
 *   
 *   Then run:
 *   npm run apply:withdrawal-fix
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyDatabaseFixes() {
  const connectionString = process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    console.error('❌ ERROR: SUPABASE_DB_URL environment variable not set');
    console.error('');
    console.error('Please set your Supabase database connection string:');
    console.error('');
    console.error('PowerShell:');
    console.error('  $env:SUPABASE_DB_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"');
    console.error('');
    console.error('Then run: npm run apply:withdrawal-fix');
    console.error('');
    console.error('Get your connection string from:');
    console.error('  Supabase Dashboard > Project Settings > Database > Connection string > Transaction pooler');
    process.exit(1);
  }

  console.log('🔄 Connecting to Supabase database...');
  
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database successfully\n');

    // Read the SQL fix file
    const sqlFilePath = path.join(__dirname, '..', 'FIX_WITHDRAWAL_DATABASE.sql');
    console.log(`📄 Reading SQL file: ${sqlFilePath}`);
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found: ${sqlFilePath}`);
    }

    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ SQL file loaded\n');

    console.log('🚀 Applying database fixes...\n');
    console.log('=' .repeat(60));
    
    // Execute the SQL
    const result = await client.query(sql);
    
    console.log('=' .repeat(60));
    console.log('\n✅ Database fixes applied successfully!\n');
    
    // Show any notices (RAISE NOTICE messages from SQL)
    if (result.rows && result.rows.length > 0) {
      console.log('📋 Results:');
      result.rows.forEach(row => {
        console.log(row);
      });
    }

    console.log('\n🎯 Next steps:');
    console.log('  1. Refresh your browser at funding-unseaf.org');
    console.log('  2. Try the withdrawal flow again');
    console.log('  3. Click "Confirm Transaction" after entering PIN');
    console.log('  4. It should now advance to the success screen!\n');

  } catch (error) {
    console.error('\n❌ ERROR applying database fixes:');
    console.error('');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('');
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('⚠️  Database host not found. Check your connection string.');
    } else if (error.message.includes('authentication failed')) {
      console.error('⚠️  Authentication failed. Check your password in the connection string.');
    } else if (error.code) {
      console.error('PostgreSQL error code:', error.code);
      console.error('Details:', error.detail || 'No additional details');
    }
    
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the fixes
applyDatabaseFixes().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
