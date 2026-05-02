import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase
        .from('tours')
        .select(`
            id,
            agent_id,
            agent:users!tours_agent_id_fkey(
                email,
                admin_profile:admin_profiles(first_name, last_name),
                agent_profile:agent_profiles(first_name, last_name, phone)
            )
        `)
        .eq('id', '6ae893e2-b654-406d-aa3b-5556db17597d')
        .single();
        
    console.log("Error:", error);
    console.log("Data:", JSON.stringify(data, null, 2));
}

run();
