import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Fetching all admins...");
    const { data: admins } = await supabase.from('admin_profiles').select('*');
    console.log(admins);
    
    console.log("Fetching all auth users...");
    const { data: { users } } = await supabase.auth.admin.listUsers();
    console.log(users.map((u: any) => ({ email: u.email, id: u.id, metadata: u.user_metadata })));
}
test();
