const { Client } = require('pg');
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
        console.error('Error reading .env.local', e);
        return {};
    }
}

const env = loadEnv();

const regions = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
    'ap-northeast-1', 'ap-northeast-2', 'ap-southeast-1', 'ap-southeast-2',
    'ca-central-1', 'sa-east-1'
];

async function tryRegion(region) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const dbUrl = `postgres://postgres.vknibpdhovgcbenkcnaz:${encodeURIComponent(env.SUPABASE_SERVICE_ROLE_KEY)}@${host}:6543/postgres`;
    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        console.log(`SUCCESS connection found for region: ${region}`);
        const sql = `
            SELECT conname, pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conrelid = 'public.tour_itinerary_drivers'::regclass;
        `;
        const res = await client.query(sql);
        console.log('Constraints:', res.rows);
        await client.end();
        return true;
    } catch (err) {
        if (!err.message.includes('not found') && !err.message.includes('ENOTFOUND')) {
            console.log(`Region ${region} resolved but error:`, err.message);
        }
        return false;
    }
}

async function run() {
    for (const r of regions) {
        const ok = await tryRegion(r);
        if (ok) break;
    }
}

run();
