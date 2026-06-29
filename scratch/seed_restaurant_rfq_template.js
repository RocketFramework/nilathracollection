const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf-8');
const env = {};
envConfig.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const template = {
  name: 'Request for Quote - Restaurant',
  type: 'RFQ_RESTAURANT',
  subject: 'Request for Quotation - Restaurant Booking – {{Restaurant Name}} – {{Date}}',
  body_html: `<p>Dear Reservations / F&B Team,</p>

<p>Greetings from <strong>Nilathra Collection</strong>.</p>

<p>We are a Colombo–based destination management company specializing in tailor-made luxury, ultra-VIP, and experiential travel for HNW and UHNW international clientele. We are currently preparing a proposal for our guests and would appreciate your best rates and availability for a restaurant booking as detailed below:</p>

<ul>
  <li><strong>Date:</strong> {{Date}}</li>
  <li><strong>Number of Pax (Guests):</strong> {{Pax}}</li>
  <li><strong>Requested Dining Time / Meal:</strong> {{Meal Type}}</li>
</ul>

<p>Kindly provide your rates and confirm the following details:</p>

<ul>
  <li><strong>Servicing Hours:</strong> What are your standard operating hours for this meal?</li>
  <li><strong>Dining Options:</strong> Do you offer buffet, à la carte, or set menu options? Please share the menus and prices.</li>
  <li><strong>Cuisine Availability:</strong> Do you have European, Sri Lankan, Chinese, or Indian food options available?</li>
  <li><strong>Room Booking:</strong> Is there an option to book a private dining room/space for this group?</li>
  <li><strong>Exclusive Booking:</strong> What are the terms/costs if we wish to book the entire facility exclusively?</li>
  <li>Any special requirements or dietary considerations we should be aware of.</li>
</ul>

<p>We look forward to your favorable response and hope this marks the beginning of a mutually beneficial partnership.</p>

<p>Warm regards,</p>

<p>
  <strong>{{Agent Name}}</strong><br>
  <strong>Senior Agent</strong><br>
  <strong>Nilathra Collection</strong>
</p>

<p>
  <strong>Nilathra Hotel Management (Pvt) Ltd</strong><br>
  <strong>Mobile:</strong> +94 (0) 777 27 8282<br>
  <strong>Email:</strong> concierge@nilathra.com<br>
  <strong>Website:</strong> https://www.nilathra.com
</p>`,
  variables: ['Restaurant Name', 'Date', 'Pax', 'Meal Type', 'Agent Name']
};

async function seed() {
  console.log("Checking if template exists...");
  const { data: existing, error: checkError } = await supabase
    .from('email_templates')
    .select('id')
    .eq('name', template.name)
    .maybeSingle();

  if (checkError) {
    console.error("Error checking existing template:", checkError);
    process.exit(1);
  }

  if (existing) {
    console.log(`Template already exists with ID: ${existing.id}. Updating it...`);
    const { error: updateError } = await supabase
      .from('email_templates')
      .update(template)
      .eq('id', existing.id);

    if (updateError) {
      console.error("Error updating template:", updateError);
      process.exit(1);
    }
    console.log("Template updated successfully.");
  } else {
    console.log("Inserting new template...");
    const { error: insertError } = await supabase
      .from('email_templates')
      .insert(template);

    if (insertError) {
      console.error("Error inserting template:", insertError);
      process.exit(1);
    }
    console.log("Template inserted successfully.");
  }
}

seed();
