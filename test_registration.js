const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
    const email = 'test_inquiry_' + Date.now() + '@example.com';
    const name = 'Test User';
    
    console.log("Creating user in auth.users...");
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { role: 'tourist' }
    });
    
    if (authError) {
        console.error("Auth error:", authError);
        return;
    }
    
    const userId = authUser.user.id;
    console.log("User created with ID:", userId);
    
    console.log("Upserting into public.users...");
    const { error: usersError } = await supabaseAdmin.from('users').upsert([
        { id: userId, email, role: 'tourist', full_name: name }
    ], { onConflict: 'id' });
    
    if (usersError) {
        console.error("public.users Upsert Error:", usersError);
    } else {
        console.log("public.users Upsert Success!");
    }
    
    console.log("Upserting into tourist_profiles...");
    const { error: tpError } = await supabaseAdmin.from('tourist_profiles').upsert([
        {
            id: userId,
            first_name: 'Test',
            last_name: 'User',
            phone: null,
        }
    ], { onConflict: 'id' });
    
    if (tpError) {
         console.error("tourist_profiles Upsert Error:", tpError);
    } else {
         console.log("tourist_profiles Upsert Success!");
    }
}

test();
