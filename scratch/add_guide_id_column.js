const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const firstEquals = trimmed.indexOf('=');
      if (firstEquals === -1) return;
      const key = trimmed.substring(0, firstEquals).trim();
      let val = trimmed.substring(firstEquals + 1).trim();
      // Remove surrounding quotes if any
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    });
  }
} catch (e) {
  console.error("Error loading env file:", e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables after parsing .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const sql = `
    ALTER TABLE public.po_blocks 
    ADD COLUMN IF NOT EXISTS guide_id UUID REFERENCES public.tour_guides(id) ON DELETE SET NULL;
  `;

  console.log("Running migration...");
  let res = await supabase.rpc('run_sql', { sql_query: sql });
  if (res.error) {
    console.log("Failed with sql_query parameter, trying with sql parameter:", res.error);
    res = await supabase.rpc('run_sql', { sql: sql });
  }

  if (res.error) {
    console.error("Migration failed:", res.error);
  } else {
    console.log("Migration succeeded! guide_id column added to po_blocks successfully.");
  }
}

run();
