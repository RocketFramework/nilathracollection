-- Add email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'AGENT_ASSIGNED', 'RATE_REQUEST', 'CUSTOM', etc.
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_read_templates ON public.email_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY admin_manage_templates ON public.email_templates FOR ALL TO authenticated USING (
    get_user_role(auth.uid()) = 'admin' OR get_user_role(auth.uid()) = 'agent'
);

-- Insert some default templates
INSERT INTO public.email_templates (name, type, subject, body_html, variables) VALUES
('Agent Assigned Notification', 'AGENT_ASSIGNED', 'Your Request Has Been Assigned – Nilathra Collection', 'Dear {{customerName}},<br/><br/>Your travel request has been assigned to {{agentName}}.<br/><br/>Reference: {{requestId}}', '["customerName", "agentName", "requestId", "packageName"]'),
('Service Rate Request', 'RATE_REQUEST', 'Rate Request for Upcoming Journey - Nilathra Collection', '<p>Dear {{providerName}},</p>\n<p>Please provide your best contracted rates and availability for the following services starting on <strong>{{arrivalDate}}</strong>:</p>\n<p>{{serviceDetails}}</p>\n<p>Warm regards,<br/><strong>Nilathra Collection Concierge Team</strong></p>', '["providerName", "arrivalDate", "serviceDetails"]'),
('Custom Customer Email', 'CUSTOM', '{{customSubject}}', '{{customBody}}', '["customSubject", "customBody"]'),
('Initial Information Request', 'INQUIRY_INFO_REQ', 'Crafting Your Bespoke Sri Lankan Journey – Nilathra Collection', '<p>Dear {{customerName}},</p>\n<p>Thank you for choosing Nilathra Collection. To help us design a bespoke Sri Lankan itinerary tailored to your preferences, please share the following details:</p>\n<ul>\n  <li><strong>Travel Dates:</strong> Specific dates or preferred month.</li>\n  <li><strong>Group Size & Dynamics:</strong> Number of travelers and ages of any children.</li>\n  <li><strong>Pace & Style:</strong> Relaxed, active, or adventure-filled.</li>\n  <li><strong>Key Interests:</strong> Culture, wildlife, food, beaches, or must-see sites.</li>\n  <li><strong>Accommodations:</strong> Boutique luxury, eco-lodges, or classic resorts.</li>\n</ul>\n<p>Please note any dietary/medical requirements. Once received, we will share an initial draft.</p>\n<p>Warm regards,<br/><strong>Nilathra Collection Concierge Team</strong></p>', '["customerName"]')
ON CONFLICT DO NOTHING;
