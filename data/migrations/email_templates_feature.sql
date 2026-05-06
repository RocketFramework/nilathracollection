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
('Service Rate Request', 'RATE_REQUEST', 'Rate Request for Upcoming Journey - Nilathra Collection', 'Dear {{providerName}},<br/><br/>Please provide rates for the following services for our clients arriving on {{arrivalDate}}.<br/><br/>{{serviceDetails}}', '["providerName", "arrivalDate", "serviceDetails"]'),
('Custom Customer Email', 'CUSTOM', '{{customSubject}}', '{{customBody}}', '["customSubject", "customBody"]'),
('Initial Information Request', 'INQUIRY_INFO_REQ', 'Crafting Your Bespoke Sri Lankan Journey – Nilathra Collection', 'Dear {{customerName}},<br/><br/>Thank you for entrusting Nilathra Collection with the curation of your upcoming journey to Sri Lanka. We are absolutely delighted to begin designing a bespoke itinerary that reflects your unique travel style.<br/><br/>To ensure every detail of your experience exceeds your expectations, we would love to learn a little more about your preferences. At your earliest convenience, kindly share the following details with us:<br/><br/><ul><li><strong>Travel Dates:</strong> Do you have exact dates in mind, or a specific month?</li><li><strong>Group Size & Dynamics:</strong> How many travelers will be joining, and are there any children (along with their ages)?</li><li><strong>Pace & Style:</strong> Do you prefer a relaxed, leisurely pace or an active, adventure-filled schedule?</li><li><strong>Interests:</strong> Are you drawn to wildlife, cultural heritage, culinary experiences, or perhaps unwinding on a pristine beach?</li><li><strong>Accommodation Preferences:</strong> Do you lean towards boutique luxury, eco-lodges, or classic five-star resorts?</li></ul><br/>If you have any specific must-see destinations or dietary requirements, please do let us know.<br/><br/>Once we have this information, our concierge team will craft an initial outline for your review.<br/><br/>We look forward to creating something truly extraordinary for you.<br/><br/>Warm regards,<br/>Your Concierge Team', '["customerName"]')
ON CONFLICT DO NOTHING;
