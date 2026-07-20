const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function dump() {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*');

  if (error) {
    console.error("Error fetching templates:", error);
  } else {
    fs.writeFileSync(path.join(__dirname, 'email_templates_dump.json'), JSON.stringify(data, null, 2), 'utf-8');
    console.log("Successfully dumped all email templates to scratch/email_templates_dump.json");
  }
}

dump();
