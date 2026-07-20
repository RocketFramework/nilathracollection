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

const templatesToUpdate = [
  {
    name: "Custom Customer Email",
    subject: "{{customSubject}}",
    body_html: "{{customBody}}"
  },
  {
    name: "Agent Assigned Notification",
    subject: "Your Request Has Been Assigned – Nilathra Collection",
    body_html: "Dear {{customerName}},<br/><br/>Your travel request has been assigned to {{agentName}}.<br/><br/>Reference: {{requestId}}"
  },
  {
    name: "Initial Information Request",
    subject: "Crafting Your Bespoke Sri Lankan Journey – Nilathra Collection",
    body_html: `<p>Dear {{customerName}},</p>\n<p>Thank you for choosing Nilathra Collection. To help us design a bespoke Sri Lankan itinerary tailored to your preferences, please share the following details:</p>\n<ul>\n  <li><strong>Travel Dates:</strong> Specific dates or preferred month.</li>\n  <li><strong>Group Size & Dynamics:</strong> Number of travelers and ages of any children.</li>\n  <li><strong>Pace & Style:</strong> Relaxed, active, or adventure-filled.</li>\n  <li><strong>Key Interests:</strong> Culture, wildlife, food, beaches, or must-see sites.</li>\n  <li><strong>Accommodations:</strong> Boutique luxury, eco-lodges, or classic resorts.</li>\n</ul>\n<p>Please note any dietary/medical requirements. Once received, we will share an initial draft.</p>\n<p>Warm regards,<br/><strong>Nilathra Collection Concierge Team</strong></p>`
  },
  {
    name: "Service Rate Request",
    subject: "Rate Request for Upcoming Journey - Nilathra Collection",
    body_html: `<p>Dear {{providerName}},</p>\n<p>Please provide your best contracted rates and availability for the following services starting on <strong>{{arrivalDate}}</strong>:</p>\n<p>{{serviceDetails}}</p>\n<p>Warm regards,<br/><strong>Nilathra Collection Concierge Team</strong></p>`
  },
  {
    name: "Draft Itinerary Share",
    subject: "Your Journey to Sri Lanka — A First Look",
    body_html: `<p>Dear [Guest Name],</p>\n<p>Attached is your custom draft itinerary based on our initial conversation. Please note:</p>\n<ul>\n  <li>Accommodations and experiences are specifically curated for you.</li>\n  <li>Budget estimates are indicative; final rates will be locked upon booking.</li>\n  <li>No bookings or holds are active yet—take your time to review.</li>\n</ul>\n<p>Please share your feedback so we can refine this to perfection. Feel free to reach out with any questions.</p>\n<p>Warm regards,<br/><strong>[Your Name]</strong><br/>Nilathra Collection | +94 777 27 8282</p>`
  },
  {
    name: "RATE request",
    subject: "Requesting Rates for Upcoming Period",
    body_html: `<p>Dear Team,</p>\n<p>Following our recent conversation, I am pleased to introduce Nilathra Collection, a luxury tour operator specializing in high-end and ultra-VIP travel experiences.</p>\n<p>As we prepare our portfolio for the upcoming travel seasons, please share your travel agency contracted rates for the Summer and Winter periods, including:</p>\n<ul>\n  <li>Room categories & rates</li>\n  <li>Meal plan supplements</li>\n  <li>Seasonal validity & blackout dates</li>\n  <li>Special offers, cancellations, and payment policies</li>\n</ul>\n<p>Please find our company profile here: <a href="https://www.nilathra.com/doc/br_nilathra.pdf">Nilathra Collection Profile</a>.</p>\n<p>Warm regards,<br/><strong>Nirosh</strong><br/>Nilathra Collection | +94 777 27 8282 | <a href="https://www.nilathra.com">www.nilathra.com</a></p>`
  },
  {
    name: "Request for Quote - Transport",
    subject: "Request for Quotation - Transport Services – {{Transport Provider Name}}",
    body_html: `<p>Dear Reservations Team,</p>\n<p>Greetings from <strong>Nilathra Collection</strong>.</p>\n<p>Please provide your best rates and availability for the transport services detailed below:</p>\n<ul>\n  <li><strong>Vehicle:</strong> {{Vehicle Make}} (Model Year: {{Model Year}})</li>\n  <li><strong>Quantity & Duration:</strong> {{Number of Vehicles}} vehicle(s) for {{Vehicle Duration}} day(s)</li>\n  <li><strong>Estimated Distance:</strong> {{Total Km}} km</li>\n  <li><strong>Preferences:</strong> Leather Seats: {{Leather Seats}} | Color: {{Vehicle Color}} | Mint Condition: {{Mint Condition}}</li>\n  <li><strong>Chauffeur:</strong> Required: {{Chauffeur Required}} | English Speaking: {{English Speaking}} (Other: {{Other Languages}})</li>\n  <li><strong>Allowances:</strong> Driver Accommodation: {{Driver Accommodation}} | Meal Rate: {{Meal Price}}</li>\n</ul>\n<p>We look forward to your prompt response.</p>\n<p>Warm regards,</p>\n<p><strong>{{Agent Name}}</strong><br/>Nilathra Collection Concierge Team<br/>concierge@nilathra.com | +94 777 27 8282</p>`
  },
  {
    name: "Request for Quote - Guide",
    subject: "Request for Quote: Tour Guide Services for {{Tour Name}} ({{Start Date}} - {{End Date}})",
    body_html: `<p>Dear {{Guide Name}},</p>\n<p>Please provide your availability and best rates for the guiding assignment detailed below:</p>\n<ul>\n  <li><strong>Tour:</strong> {{Tour Name}}</li>\n  <li><strong>Dates:</strong> {{Start Date}} to {{End Date}} ({{Duration}} Days)</li>\n</ul>\n<p><strong>Details required:</strong> Daily guide rate, meal allowance requirements, and confirmation if FOC accommodation is required.</p>\n<div style="margin-top: 15px; background-color: #FBFBFA; border: 1px solid #E6E4E0; padding: 12px; border-radius: 8px;">\n  <strong>Tentative Itinerary:</strong><br/>{{Itinerary Details}}\n</div>\n<p>Warm regards,</p>\n<p><strong>{{Agent Name}}</strong><br/>Nilathra Collection Concierge Team<br/>concierge@nilathra.com | +94 777 27 8282</p>`
  },
  {
    name: "Request for Quote - Driver",
    subject: "Request for Quote: Driver/Chauffeur Services for {{Tour Name}} ({{Start Date}} - {{End Date}})",
    body_html: `<p>Dear {{Driver Name}},</p>\n<p>Please provide your availability and best rates for the driver/chauffeur assignment detailed below:</p>\n<ul>\n  <li><strong>Tour:</strong> {{Tour Name}}</li>\n  <li><strong>Dates:</strong> {{Start Date}} to {{End Date}} ({{Duration}} Days)</li>\n</ul>\n<p><strong>Details required:</strong> Daily rate, meal allowance requirements, and confirmation if FOC accommodation is required.</p>\n<div style="margin-top: 15px; background-color: #FBFBFA; border: 1px solid #E6E4E0; padding: 12px; border-radius: 8px;">\n  <strong>Tentative Itinerary:</strong><br/>{{Itinerary Details}}\n</div>\n<p>Warm regards,</p>\n<p><strong>{{Agent Name}}</strong><br/>Nilathra Collection Concierge Team<br/>concierge@nilathra.com | +94 777 27 8282</p>`
  },
  {
    name: "Request For Quote",
    subject: "Request for Travel Agent Net Rates – {{Hotel Name}} – {{from-Dates}} to {{to-Date}}",
    body_html: `<p>Dear Reservations Team,</p>\n<p>Greetings from <strong>Nilathra Collection</strong>.</p>\n<p>Please provide your best travel agent net rates and availability for the stay detailed below:</p>\n<ul>\n  <li><strong>Check-in:</strong> {{DD MMM YYYY}}</li>\n  <li><strong>Check-out:</strong> {{DD MMM YYYY}} ({{X}} Nights)</li>\n  <li><strong>Rooms Required:</strong> {{Number and room category}}</li>\n  <li><strong>Occupancy:</strong> {{e.g., 2 Adults / 2 Adults + 1 Child (age)}}</li>\n  <li><strong>Meal Basis:</strong> {{BB / HB / FB / AI}}</li>\n</ul>\n<p>Please also confirm availability of adjacent rooms, buggy cars/EVs, heli-pad, upgrades/offers, and your cancellation policies.</p>\n<p>Warm regards,</p>\n<p><strong>{{Agent Name}}</strong><br/>Nilathra Collection Concierge Team<br/>concierge@nilathra.com | +94 777 27 8282</p>`
  },
  {
    name: "Request for Quote - Restaurant",
    subject: "Request for Quotation - Restaurant Booking – {{Restaurant Name}} – {{Date}}",
    body_html: `<p>Dear Reservations / F&B Team,</p>\n<p>Greetings from <strong>Nilathra Collection</strong>.</p>\n<p>Please provide your best rates and availability for the restaurant booking detailed below:</p>\n<ul>\n  <li><strong>Date:</strong> {{Date}}</li>\n  <li><strong>Guests:</strong> {{Pax}} Pax</li>\n  <li><strong>Requested Meal & Time:</strong> {{Meal Type}}</li>\n</ul>\n<p>Please share menus/pricing (buffet, set, or à la carte) and confirm if private dining space or exclusive booking options are available, along with dietary policies.</p>\n<p>Warm regards,</p>\n<p><strong>{{Agent Name}}</strong><br/>Nilathra Collection Concierge Team<br/>concierge@nilathra.com | +94 777 27 8282</p>`
  }
];

async function update() {
  for (const t of templatesToUpdate) {
    const { error } = await supabase
      .from('email_templates')
      .update({ subject: t.subject, body_html: t.body_html })
      .eq('name', t.name);

    if (error) {
      console.error(`Error updating template "${t.name}":`, error);
    } else {
      console.log(`Successfully updated template "${t.name}"`);
    }
  }
}

update();
