-- Add Request for Quote - Restaurant email template
INSERT INTO public.email_templates (name, type, subject, body_html, variables)
VALUES (
    'Request for Quote - Restaurant',
    'RFQ_RESTAURANT',
    'Request for Quotation - Restaurant Booking – {{Restaurant Name}} – {{Date}}',
    '<p>Dear Reservations / F&B Team,</p>\n<p>Greetings from <strong>Nilathra Collection</strong>.</p>\n<p>Please provide your best rates and availability for the restaurant booking detailed below:</p>\n<ul>\n  <li><strong>Date:</strong> {{Date}}</li>\n  <li><strong>Guests:</strong> {{Pax}} Pax</li>\n  <li><strong>Requested Meal & Time:</strong> {{Meal Type}}</li>\n</ul>\n<p>Please share menus/pricing (buffet, set, or à la carte) and confirm if private dining space or exclusive booking options are available, along with dietary policies.</p>\n<p>Warm regards,</p>\n<p><strong>{{Agent Name}}</strong><br/>Nilathra Collection Concierge Team<br/>concierge@nilathra.com | +94 777 27 8282</p>',
    '["Restaurant Name", "Date", "Pax", "Meal Type", "Agent Name"]'::jsonb
)
ON CONFLICT DO NOTHING;
