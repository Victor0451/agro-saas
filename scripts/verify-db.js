const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function verify() {
    try {
        // 1. Read .env.local
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('❌ .env.local not found');
            process.exit(1);
        }

        const envContent = fs.readFileSync(envPath, 'utf-8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
                env[key] = value;
            }
        });

        const url = env.NEXT_PUBLIC_SUPABASE_URL;
        const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key || url.includes('your-project-url')) {
            console.error('❌ Invalid Configuration in .env.local');
            console.log('URL:', url);
            console.log('KEY:', key ? '******' : 'Missing');
            process.exit(1);
        }

        console.log('✅ Configuration loaded');
        console.log(`   URL: ${url}`);

        // 2. Connect to Supabase
        const supabase = createClient(url, key);

        // 3. Test Table Access (Tenants)
        console.log('🔄 Testing connection to "tenants" table...');
        const { count, error } = await supabase
            .from('tenants')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection Failed:', error.message);
            console.error('   Hint: Did you run the SQL migrations?');
            process.exit(1);
        }

        console.log('✅ Connection Successful!');
        console.log('✅ "tenants" table exists and is accessible.');

        // 4. Test RLS (Should be empty or error if no user, but table access is key)
        // Actually, generic Anon key should be able to "select" but RLS might return 0 rows.
        // However, if table exists, error is null.
        // If table didn't exist, error would be "relation does not exist".

        process.exit(0);

    } catch (err) {
        console.error('❌ Unexpected Error:', err);
        process.exit(1);
    }
}

verify();
