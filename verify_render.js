// Verify Render API Key
const RENDER_API_KEY = 'rnd_njjyDhs1K3sop4ElsCQ644j4V5N5';

async function verifyRenderAccess() {
    console.log('🔍 Verifying Render API Access...\n');

    try {
        const response = await fetch('https://api.render.com/v1/owners', {
            headers: {
                'Authorization': `Bearer ${RENDER_API_KEY}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Render API Connection Successful!');
        console.log(`Found ${data.length} owner(s):`);
        data.forEach(owner => {
            console.log(`- ${owner.name} (${owner.email}) [ID: ${owner.id}]`);
        });

        return true;
    } catch (error) {
        console.error('❌ Render API Connection Failed:', error.message);
        return false;
    }
}

verifyRenderAccess();
