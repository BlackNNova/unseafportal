import { supabase } from './supabase.js';

export const verifySupabaseTables = async () => {
  console.log('🧪 TEST: Checking Supabase tables...');
  
  const tables = ['users', 'admins', 'transactions', 'support_tickets'];
  const results = {};
  
  for (const table of tables) {
    try {
      console.log(`🧪 TEST: Checking table '${table}'...`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      results[table] = {
        exists: !error,
        error: error?.message,
        sampleData: data?.[0] || null,
        count: data?.length || 0
      };
      
      if (!error) {
        console.log(`✅ Table '${table}' exists with ${data?.length || 0} sample records`);
        if (data?.[0]) {
          console.log(`🧪 TEST: ${table} columns:`, Object.keys(data[0]));
        }
      } else {
        console.warn(`❌ Table '${table}' error:`, error.message);
      }
      
    } catch (err) {
      results[table] = { exists: false, error: err.message };
      console.error(`❌ Table '${table}' exception:`, err.message);
    }
  }
  
  console.log('🧪 TEST: Table verification complete:', results);
  return results;
};
