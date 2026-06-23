const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function loadEnv() {
    try {
        const envContent = fs.readFileSync('.env.local', 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const parts = trimmed.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    let val = parts.slice(1).join('=').trim();
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.slice(1, -1);
                    }
                    env[key] = val;
                }
            }
        });
        return env;
    } catch (e) {
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Updating 'payslips' bucket to public=false (private)...");
    const { data, error } = await supabase.storage.updateBucket('payslips', {
        public: false,
        allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png', 'image/gif'],
        fileSizeLimit: 10485760 // 10MB
    });

    if (error) {
        console.error("Failed to update bucket to private:", error);
    } else {
        console.log("Successfully updated 'payslips' bucket to private:", data);
    }
}

run();
