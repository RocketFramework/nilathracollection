const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    // We need an admin user token to test RLS, or we can use the service role key if available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey);
    
    // Attempt an insert exactly as the app does
    const payload = {
        name: "Test Transport Provider",
        phone: "1234567890",
        email: "test@test.com",
        address: "Test Address",
        nic_number: "12345V",
        is_suspended: false
    };

    console.log("Attempting insert...");
    const { data, error } = await adminSupabase.from('transport_providers').insert([payload]).select().single();
    
    console.log("Data:", data);
    console.log("Error:", error);
}

run();
