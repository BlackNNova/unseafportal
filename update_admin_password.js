// Update Admin Password Script
// Run this with: node update_admin_password.js

const SUPABASE_URL = 'https://qghsyyyompjuxjtbqiuk.supabase.co';
const SERVICE_ROLE_KEY = 'sbp_7abffd8ecc76a3bdad1c69db8c6e2a70aa3202c5';
const NEW_PASSWORD = '&#h&84K@';

async function updateAdminPassword() {
  console.log('🔐 Updating admin password...\n');

  try {
    // Step 1: Find admin user
    console.log('Step 1: Finding admin user...');
    const findUserResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users`,
      {
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const usersData = await findUserResponse.json();
    console.log(`Found ${usersData.users?.length || 0} users`);

    // Find admin user (look for admin email or specific user)
    const adminUser = usersData.users?.find(user => 
      user.email?.includes('admin') || 
      user.email?.includes('unseaf') ||
      user.user_metadata?.role === 'admin'
    );

    if (!adminUser) {
      console.log('\n❌ No admin user found!');
      console.log('Available users:');
      usersData.users?.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      });
      console.log('\nPlease manually specify the admin user ID in the script.');
      return;
    }

    console.log(`✅ Found admin user: ${adminUser.email} (ID: ${adminUser.id})\n`);

    // Step 2: Update password
    console.log('Step 2: Updating password...');
    const updateResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users/${adminUser.id}`,
      {
        method: 'PUT',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: NEW_PASSWORD
        })
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      console.log('❌ Failed to update password:', error);
      return;
    }

    const updateData = await updateResponse.json();
    console.log('✅ Password updated successfully!\n');

    // Step 3: Verify
    console.log('Step 3: Verification');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Admin Email: ${adminUser.email}`);
    console.log(`New Password: ${NEW_PASSWORD}`);
    console.log(`User ID: ${adminUser.id}`);
    console.log(`Updated At: ${new Date().toISOString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎉 Admin password update complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Test login at: https://funding-unseaf.org/admin/login');
    console.log(`2. Email: ${adminUser.email}`);
    console.log(`3. Password: ${NEW_PASSWORD}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

// Run the update
updateAdminPassword();
