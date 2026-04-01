const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data } = await supabase.rpc('get_schema_info'); // or just query information_schema if possible
  // query tables
  const { data: tables } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public');
  console.log(tables?.map(t => t.table_name).filter(t => t.includes('message') || t.includes('chat') || t.includes('tour')));
}
run();
