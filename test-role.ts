import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
const supabaseAnon = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data: admins } = await supabaseAdmin.from('admin_profiles').select('*');
    console.log("Admins:", admins);
    if (admins && admins.length > 0) {
        for (const admin of admins) {
            console.log(`Checking role for ${admin.id}...`);
            const { data, error } = await supabaseAdmin.rpc('get_user_role', { user_id: admin.id });
            console.log(`Role for ${admin.id}:`, data, error);
            
            // Also test with a regular user context representing that admin if possible, 
            // but for now let's just see if the RPC function exists and what it returns.
        }
    }
}
test();
