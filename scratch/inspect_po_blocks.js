const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse env
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let value = trimmed.substring(idx + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (err) {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function inspect() {
  const { data, error } = await supabase.from('po_blocks').select('*').limit(1);
  if (error) {
    console.error("Error fetching po_blocks:", error);
  } else {
    console.log("Success! Columns in po_blocks:", data && data.length > 0 ? Object.keys(data[0]) : "No records found to inspect columns, let's check table info.");
  }
}

inspect();
