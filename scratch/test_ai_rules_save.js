const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSave() {
  const tourId = 'c0569dc7-0eb6-4362-a071-668b643f3b54';
  const { data: latest } = await supabase
    .from('draft_itinerary_versions')
    .select('*')
    .eq('tour_id', tourId)
    .limit(1);

  if (latest && latest.length > 0) {
    const versionId = latest[0].id;
    console.log('Testing update on versionId:', versionId);
    const { data, error } = await supabase
      .from('draft_itinerary_versions')
      .update({ ai_rules: { generic: 'Test generic', specific: 'Test specific' } })
      .eq('id', versionId)
      .select('*');

    if (error) {
      console.error('Update with ai_rules column error:', error.message);
    } else {
      console.log('Successfully updated with ai_rules column! Data:', data);
    }
  }
}

testSave();
