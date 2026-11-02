const { createClient } = require("@supabase/supabase-js");
const src = require("fs").readFileSync(__dirname + "/check_db.js", "utf8");
const supabase = createClient(src.match(/const url = "([^"]+)"/)[1], src.match(/const key = "([^"]+)"/)[1]);
(async () => {
  const { data } = await supabase.from("daily_activities").select("*").in("id", ["c92e43ae-b466-42eb-9cf7-1be98ba96c1a", "7b581220-2b62-4508-8459-8d897fbb868f"]);
  data.forEach(a => console.log(JSON.stringify(Object.fromEntries(Object.entries(a).filter(([k]) => /lkr|fx|contracted|updated_at|created_at|title/.test(k))))));
})();
