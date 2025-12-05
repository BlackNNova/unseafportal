// Generate Password Reset Link for Moses Nyanga
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qghsyyyompjuxjtbqiuk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaHN5eXlvbXBqdXhqdGJxaXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU4ODUwMywiZXhwIjoyMDczMTY0NTAzfQ.NVw73mYtHki57OelhZduFipUGaoD73ZJjaSyolHjJvM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function generateResetLink() {
    console.log('🔐 Generating Password Reset Link...\n');

    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: 'mosesnyanga003@gmail.com',
        options: {
            redirectTo: 'https://funding-unseaf.org/reset-password'
        }
    });

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log('✅ Password Reset Link Generated!\n');
    console.log('User: Moses Nyanga (mosesnyanga003@gmail.com)');
    console.log('Grant: UNSEAF-25/GR-0097\n');
    console.log('='.repeat(70));
    console.log('\n' + data.properties.action_link + '\n');
    console.log('='.repeat(70));
    console.log('\n⚠️  Valid for 24 hours | One-time use only');
}

generateResetLink();
