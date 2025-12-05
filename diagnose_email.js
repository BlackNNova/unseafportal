// Diagnose Password Reset Email Issue
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qghsyyyompjuxjtbqiuk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaHN5eXlvbXBqdXhqdGJxaXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU4ODUwMywiZXhwIjoyMDczMTY0NTAzfQ.NVw73mYtHki57OelhZduFipUGaoD73ZJjaSyolHjJvM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const userEmail = 'mosesnyanga003@gmail.com';

console.log('🔍 Diagnosing Password Reset Email Issue\n');
console.log('='.repeat(70));
console.log(`User: ${userEmail}`);
console.log('Error: "error sending recovery email"\n');

async function diagnose() {
    // Step 1: Verify user exists
    console.log('📋 Step 1: Verifying user exists in auth...\n');

    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('❌ Error listing auth users:', authError.message);
        return;
    }

    const authUser = authUsers.users.find(u => u.email === userEmail);

    if (!authUser) {
        console.log('❌ User NOT found in auth.users!');
        console.log('   This is why password reset fails - no auth record exists.');
        return;
    }

    console.log('✅ User found in auth:');
    console.log(`   ID: ${authUser.id}`);
    console.log(`   Email: ${authUser.email}`);
    console.log(`   Email Confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   Last Sign In: ${authUser.last_sign_in_at || 'Never'}`);

    // Step 2: Try to generate a recovery link (tests the email system)
    console.log('\n📧 Step 2: Testing recovery link generation...\n');

    try {
        const { data, error } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: userEmail,
            options: {
                redirectTo: 'https://funding-unseaf.org/reset-password'
            }
        });

        if (error) {
            console.log('❌ Recovery link generation failed:');
            console.log(`   Error: ${error.message}`);
            console.log(`   Code: ${error.code || 'N/A'}`);
            console.log(`   Status: ${error.status || 'N/A'}`);

            // Common issues
            if (error.message.includes('rate limit')) {
                console.log('\n⚠️  DIAGNOSIS: Rate limit exceeded');
                console.log('   Solution: Wait a few minutes and try again.');
            } else if (error.message.includes('SMTP') || error.message.includes('email')) {
                console.log('\n⚠️  DIAGNOSIS: SMTP/Email configuration issue');
                console.log('   Solution: Check Supabase Dashboard > Project Settings > Authentication > SMTP Settings');
            }
            return;
        }

        console.log('✅ Recovery link generated successfully!');
        console.log('\n🔗 Password Reset Link (valid for 24 hours):');
        console.log('='.repeat(70));
        console.log(data.properties.action_link);
        console.log('='.repeat(70));
        console.log('\n📌 You can send this link directly to the user.');
        console.log('   They will be able to set a new password using this link.');

    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
    }

    // Step 3: Check Supabase project settings hint
    console.log('\n📝 Step 3: Possible causes of "error sending recovery email":\n');
    console.log('1. SMTP not configured in Supabase Dashboard');
    console.log('   → Go to: Supabase Dashboard > Project Settings > Authentication > SMTP');
    console.log('   → Set up custom SMTP (Hostinger, SendGrid, etc.)\n');
    console.log('2. Supabase free tier email limit reached (4 emails/hour)');
    console.log('   → Solution: Configure custom SMTP or wait an hour\n');
    console.log('3. Email marked as spam by recipient\'s email provider');
    console.log('   → Solution: Use custom SMTP with proper DNS records (SPF, DKIM, DMARC)\n');
}

diagnose().catch(console.error);
