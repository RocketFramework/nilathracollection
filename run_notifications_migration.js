const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const sqlCreate = fs.readFileSync('data/create_notifications_table.sql', 'utf8');
    const { error: errCreate } = await supabase.rpc('run_sql', { sql_query: sqlCreate });
    console.log('Create table result:', errCreate || 'success');

    const sqlAlter = fs.readFileSync('data/alter_notifications.sql', 'utf8');
    const { error: errAlter } = await supabase.rpc('run_sql', { sql_query: sqlAlter });
    console.log('Alter table result:', errAlter || 'success');
}
run();
