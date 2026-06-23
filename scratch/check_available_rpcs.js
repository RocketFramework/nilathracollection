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
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
    const fetchUrl = `${url}/rest/v1/`;
    console.log("Fetching OpenAPI spec from:", fetchUrl);
    try {
        const res = await fetch(fetchUrl, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log("Paths available in REST API:");
        const rpcPaths = Object.keys(data.paths).filter(p => p.startsWith('/rpc/'));
        console.log(rpcPaths);
    } catch (err) {
        console.error("Error:", err.message);
    }
}

check();
