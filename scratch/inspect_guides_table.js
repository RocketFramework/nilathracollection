const fs = require("fs");
const path = require("path");

let envFile = "";
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  envFile = fs.readFileSync(envPath, "utf8");
}

const envVars = {};
envFile.split("\n").forEach(line => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, "");
    envVars[key] = val;
  }
});

const { createClient } = require("@supabase/supabase-js");
const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from("tour_guides").select("*").limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Tour guides keys:", data && data.length > 0 ? Object.keys(data[0]) : "No rows or empty");
    console.log("Sample row:", data);
  }
}
check();
