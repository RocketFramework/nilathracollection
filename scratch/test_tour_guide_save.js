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

async function testSave() {
  console.log("Testing tour guide save logic...");
  const guideData = {
    first_name: "Test",
    last_name: "Guide",
    phone: "+94770000000",
    languages: ["English"],
    is_suspended: false,
    has_contracted_price: true,
    per_day_rate: 25,
    daily_rate: 25
  };

  // Simulating MasterDataService.saveTourGuide logic
  const { payment_details, id, payment_detail_id, per_day_rate, daily_rate, ...cleanData } = guideData;
  const rate = daily_rate ?? per_day_rate;
  const payload = {
    ...cleanData,
    payment_detail_id: payment_detail_id || null
  };
  if (rate !== undefined) {
    payload.daily_rate = rate;
  }

  console.log("Payload to insert into tour_guides:", payload);
  const { data, error } = await supabase.from("tour_guides").insert([payload]).select().single();
  if (error) {
    console.error("Save error:", error);
  } else {
    console.log("Successfully saved tour guide! Saved row:", data);
    // Cleanup test record
    await supabase.from("tour_guides").delete().eq("id", data.id);
    console.log("Cleaned up test record.");
  }
}

testSave();
