const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function run() {
    const { data: users, error } = await supabase.from('users').select('*').eq('role', 'admin');
    if (error) {
        console.error(error);
    } else {
        console.log("Admin Users:", users);
    }
}
run();
