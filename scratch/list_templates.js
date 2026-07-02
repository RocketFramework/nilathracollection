const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const { createAdminClient } = require('../src/utils/supabase/admin');

async function run() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('email_templates')
        .select('name, type');
    if (error) {
        console.error(error);
        return;
    }
    console.log("Email Templates:", data);
}

run();
