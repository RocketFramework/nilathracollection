const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf-8');
const env = {};
envConfig.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
});

const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const key = env['SUPABASE_SERVICE_ROLE_KEY'];

async function check() {
    const fetchUrl = `${url}/rest/v1/`;
    try {
        const res = await fetch(fetchUrl, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        const data = await res.json();
        const definition = data.definitions.customer_payments;
        if (definition) {
            console.log("customer_payments properties:", definition.properties);
        } else {
            console.log("customer_payments definition not found in schema.");
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}

check();
