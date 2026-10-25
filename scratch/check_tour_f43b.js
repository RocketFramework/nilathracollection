const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#")).map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }));
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const id = "f43b82e9-8d0a-4d1e-bb97-f3c8d2f46fe3";
(async () => {
    const { data: t, error } = await s.from("tours").select("id,title,status,tourist_id,agent_id,start_date,end_date").eq("id", id).maybeSingle();
    console.log("tour", t, error);
    if (t?.tourist_id) {
        const { data: u } = await s.from("users").select("id,email,role").eq("id", t.tourist_id).maybeSingle();
        console.log("tourist user", u);
    }
    const { data: all } = await s.from("tours").select("status").limit(2000);
    const c = {}; (all || []).forEach(r => c[r.status] = (c[r.status] || 0) + 1);
    console.log("status counts", c);
})();
