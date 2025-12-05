// ============================================
// UNSEAF Admin Status Change Debugging Script
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qghsyyyompjuxjtbqiuk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaHN5eXlvbXBqdXhqdGJxaXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU4ODUwMywiZXhwIjoyMDczMTY0NTAzfQ.NVw73mYtHki57OelhZduFipUGaoD73ZJjaSyolHjJvM';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaHN5eXlvbXBqdXhqdGJxaXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1ODg1MDMsImV4cCI6MjA3MzE2NDUwM30.MJ0z_R1TDqE5CcECVw--FPGD_9-SZbp-aJU3pXEwDlw';

// Create clients for both service role and anon role
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 UNSEAF Admin Status Change Debug Test');
console.log('===============================================\n');

async function testStatusChange() {
  try {
    console.log('🔍 Step 1: Checking users table and current statuses...\n');
    
    // Get users with different statuses using service key
    const { data: allUsers, error: fetchError } = await supabaseService
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (fetchError) {
      console.error('❌ Failed to fetch users:', fetchError);
      return;
    }
    
    console.log(`✅ Found ${allUsers.length} users`);
    allUsers.forEach(user => {
      console.log(`  - ${user.first_name} ${user.last_name}: ${user.account_status} (ID: ${user.id})`);
    });
    
    // Find a user with approved status to test changing
    const approvedUser = allUsers.find(user => user.account_status === 'approved');
    
    if (!approvedUser) {
      console.log('⚠️  No approved users found to test with. Creating test user...');
      
      // Create a test user
      const testUser = {
        id: crypto.randomUUID(),
        email: 'test-unseaf-2025-gr-9999@internal.unseaf.org',
        grant_number: 'UNSEAF-2025/GR-9999',
        first_name: 'Test',
        last_name: 'User',
        account_number: 'ACC-999999',
        balance: 0,
        account_status: 'approved',
        kyc_status: 'pending'
      };
      
      const { data: createdUser, error: createError } = await supabaseService
        .from('users')
        .insert(testUser)
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create test user:', createError);
        return;
      }
      
      console.log('✅ Test user created:', createdUser);
      return testStatusChange(); // Retry with new test user
    }
    
    console.log(`\n🧪 Step 2: Testing status change on user: ${approvedUser.first_name} ${approvedUser.last_name}`);
    console.log(`   Current status: ${approvedUser.account_status}`);
    console.log(`   User ID: ${approvedUser.id}`);
    
    // Test 1: Try changing status using service key
    console.log('\n🔧 Test 1: Changing status using SERVICE KEY...');
    const { data: serviceUpdateData, error: serviceUpdateError } = await supabaseService
      .from('users')
      .update({ account_status: 'rejected' })
      .eq('id', approvedUser.id)
      .select();
    
    if (serviceUpdateError) {
      console.error('❌ Service key update failed:', serviceUpdateError);
    } else {
      console.log('✅ Service key update successful:', serviceUpdateData);
    }
    
    // Verify the change
    const { data: verifyData, error: verifyError } = await supabaseService
      .from('users')
      .select('account_status')
      .eq('id', approvedUser.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Failed to verify change:', verifyError);
    } else {
      console.log(`📋 Status after service key update: ${verifyData.account_status}`);
    }
    
    // Test 2: Try changing status using anon key (like admin dashboard would)
    console.log('\n🔧 Test 2: Changing status using ANON KEY (simulating admin dashboard)...');
    
    // First, authenticate as admin
    const { data: adminAuth, error: adminAuthError } = await supabaseAnon.auth.signInWithPassword({
      email: 'admin@unseaf.org',
      password: 'admin123'
    });
    
    if (adminAuthError) {
      console.error('❌ Admin authentication failed:', adminAuthError);
      console.log('⚠️  Trying with anon key without auth...');
      
      const { data: anonUpdateData, error: anonUpdateError } = await supabaseAnon
        .from('users')
        .update({ account_status: 'pending' })
        .eq('id', approvedUser.id)
        .select();
      
      if (anonUpdateError) {
        console.error('❌ Anon key update failed:', anonUpdateError);
        console.log('🔍 This might be the issue - RLS policies blocking updates!');
      } else {
        console.log('✅ Anon key update successful:', anonUpdateData);
      }
    } else {
      console.log('✅ Admin authenticated successfully');
      
      const { data: authUpdateData, error: authUpdateError } = await supabaseAnon
        .from('users')
        .update({ account_status: 'pending' })
        .eq('id', approvedUser.id)
        .select();
      
      if (authUpdateError) {
        console.error('❌ Authenticated update failed:', authUpdateError);
        console.log('🔍 This might be the RLS policy issue!');
      } else {
        console.log('✅ Authenticated update successful:', authUpdateData);
      }
    }
    
    // Final verification
    const { data: finalVerify, error: finalVerifyError } = await supabaseService
      .from('users')
      .select('account_status')
      .eq('id', approvedUser.id)
      .single();
    
    if (finalVerifyError) {
      console.error('❌ Final verification failed:', finalVerifyError);
    } else {
      console.log(`📋 Final status: ${finalVerify.account_status}`);
    }
    
    // Test 3: Check RLS policies
    console.log('\n🔧 Step 3: Investigating RLS Policies...');
    
    const { data: policies, error: policyError } = await supabaseService
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'users');
    
    if (policyError) {
      console.error('❌ Failed to fetch RLS policies:', policyError);
    } else {
      console.log('📋 RLS Policies for users table:');
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd} - ${policy.qual || policy.with_check}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

async function checkAdminPermissions() {
  console.log('\n🔍 Step 4: Checking admin permissions and setup...\n');
  
  try {
    // Check if admins table exists and has data
    const { data: admins, error: adminError } = await supabaseService
      .from('admins')
      .select('*');
    
    if (adminError) {
      console.error('❌ Failed to fetch admins:', adminError);
    } else {
      console.log(`✅ Found ${admins.length} admin(s):`);
      admins.forEach(admin => {
        console.log(`  - ${admin.username} (${admin.email}) - Role: ${admin.role}`);
      });
    }
    
    // Test direct SQL execution
    console.log('\n🧪 Testing direct SQL update...');
    
    const { data: sqlResult, error: sqlError } = await supabaseService.rpc('exec_sql', {
      sql_query: `
        SELECT id, first_name, last_name, account_status 
        FROM users 
        WHERE account_status = 'approved' 
        LIMIT 1;
      `
    });
    
    if (sqlError) {
      console.error('❌ SQL execution failed:', sqlError);
    } else {
      console.log('✅ SQL execution successful:', sqlResult);
    }
    
  } catch (error) {
    console.error('❌ Admin permission check failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  await testStatusChange();
  await checkAdminPermissions();
  
  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('1. Check if admin is properly authenticated in the dashboard');
  console.log('2. Verify RLS policies allow admins to update user records');
  console.log('3. Ensure the admin dashboard is using the correct Supabase client');
  console.log('4. Check for any middleware or triggers preventing status updates');
  console.log('\n✅ Debug test completed!');
}

runAllTests().catch(console.error);