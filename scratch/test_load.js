const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
let supabaseUrl = '';
let supabaseKey = '';

try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
          supabaseUrl = val;
        } else if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
          supabaseKey = val;
        }
      }
    }
  }
} catch (e) {
  console.error("Error reading env file:", e);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tourId = '60dec7e8-cbd9-4801-9f97-b41e5062fcc2'; // Rasika Ranasinghe
  
  const { data: tourMsg, error } = await supabase
    .from('tours')
    .select(`
        *,
        request:requests(
            email, 
            name,
            phone_number,
            note,
            budget,
            start_date,
            duration_nights,
            adults,
            children,
            infants,
            details:request_details(*)
        ),
        tourist:users!tours_tourist_id_fkey(
            email,
            tourist_profile:tourist_profiles(
                first_name, last_name, phone, country, passport_number, address,
                adults, children, infants, arrival_date, departure_date, duration_days,
                budget_total, budget_per_person, travel_style, departure_country,
                dietary_requirements, medical_conditions, accessibility_requirements,
                language_preference, special_notes
            )
        )
    `)
    .eq('id', tourId)
    .single();

  if (error) {
    console.error("Fetch error:", error);
    return;
  }

  console.log("Raw tourist object returned from query:", JSON.stringify(tourMsg.tourist, null, 2));

  const tourist = tourMsg.tourist;
  const touristProfile = tourist?.tourist_profile?.[0] || {};
  console.log("Extracted touristProfile:", JSON.stringify(touristProfile, null, 2));

  const mergedProfile = {
      adults: touristProfile.adults !== null && touristProfile.adults !== undefined ? touristProfile.adults : 2,
      children: touristProfile.children !== null && touristProfile.children !== undefined ? touristProfile.children : 0,
      infants: touristProfile.infants !== null && touristProfile.infants !== undefined ? touristProfile.infants : 0,
      arrivalDate: touristProfile.arrival_date || '',
      departureDate: touristProfile.departure_date || '',
  };
  console.log("mergedProfile result:", mergedProfile);
}

run();
