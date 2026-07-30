const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAppSettings() {
  console.log('--- Checking app_settings for vehicle day rates and transport markup ---');

  const { data, error } = await supabase.from('app_settings').select('*');
  console.log('Total settings count:', data?.length, error);
  if (data) {
    data.forEach(s => {
      if (s.setting_key.includes('vehicle') || s.setting_key.includes('transport') || s.setting_key.includes('markup')) {
        console.log(`Setting [${s.setting_key}]:`, s.setting_value);
      }
    });
  }
}

checkAppSettings();
