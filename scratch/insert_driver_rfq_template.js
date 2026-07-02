const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const { createAdminClient } = require('../src/utils/supabase/admin');

async function run() {
    const supabase = createAdminClient();

    const name = 'Request for Quote - Driver';
    const subject = 'Request for Quote: Driver/Chauffeur Services for {{Tour Name}} ({{Start Date}} - {{End Date}})';
    const body_html = `<p>Dear {{Driver Name}},</p><p>We would like to request a quote for your professional driver/chauffeur services for the following upcoming tour:</p><table style="border-collapse: collapse; width: 100%; margin-bottom: 20px; font-family: sans-serif; font-size: 14px;"><tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9; width: 200px; text-align: left;">Tour Name</td><td style="padding: 8px; border: 1px solid #ddd; text-align: left;">{{Tour Name}}</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9; text-align: left;">Start Date</td><td style="padding: 8px; border: 1px solid #ddd; text-align: left;">{{Start Date}}</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9; text-align: left;">End Date</td><td style="padding: 8px; border: 1px solid #ddd; text-align: left;">{{End Date}}</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9; text-align: left;">Duration</td><td style="padding: 8px; border: 1px solid #ddd; text-align: left;">{{Duration}} Days</td></tr></table><p>Please review the details above and confirm your availability and rates.</p><h3 style="color: #1B3A2D; font-family: serif; font-size: 16px; margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Your Quote Details Required:</h3><ul><li><strong>Daily Rate:</strong> Please specify your daily rate for this driving/chauffeur assignment.</li><li><strong>Meal Requirements:</strong> Please confirm if you require meals to be provided/allowance or if you have specific preferences.</li><li><strong>Accommodation Requirements:</strong> Please confirm if driver accommodation (FOC) is required at the tour destinations or if you have specific requirements.</li></ul><p>Additionally, here is the tentative itinerary for the tour:</p><div style="margin-top: 15px; background-color: #FBFBFA; border: 1px solid #E6E4E0; padding: 12px; border-radius: 12px;"><strong style="color: #1B3A2D; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 6px;">Daily Tour Itinerary Details</strong>{{Itinerary Details}}</div><p>Kindly reply to this email at your earliest convenience with your rates and requirements.</p><p>Best regards,<br/><strong>{{Agent Name}}</strong><br/>Nilathra Collection Concierge Team</p>`;

    console.log("Checking if template exists: " + name);
    const { data: existing } = await supabase
        .from('email_templates')
        .select('id')
        .eq('name', name)
        .maybeSingle();

    if (existing) {
        console.log("Updating existing template, ID: " + existing.id);
        const { data, error } = await supabase
            .from('email_templates')
            .update({
                subject,
                body_html,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select();
        if (error) {
            console.error("Error updating email template:", error);
            process.exit(1);
        }
        console.log("Successfully updated:", data);
    } else {
        console.log("Inserting new template...");
        const { data, error } = await supabase
            .from('email_templates')
            .insert([{
                name,
                subject,
                body_html,
                type: 'RFQ',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select();
        if (error) {
            console.error("Error inserting email template:", error);
            process.exit(1);
        }
        console.log("Successfully inserted:", data);
    }
}

run();
