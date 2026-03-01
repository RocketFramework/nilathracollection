-- Drop existing objects if necessary (use cautiously in production)
-- ... (You might want to add scripts to clean up before recreating)

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-------------------------------------------------------------------------------
-- 1. Roles & Users
-------------------------------------------------------------------------------
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL, -- 'tourist', 'agent', 'admin'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Core users table (Links to auth.users in Supabase)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles linking
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- Tourist Profile
CREATE TABLE tourist_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    country VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Travel Agent Profile
CREATE TABLE agent_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Profile
CREATE TABLE admin_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-------------------------------------------------------------------------------
-- 2. Vendors & Resources
-------------------------------------------------------------------------------
CREATE TABLE hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location_address VARCHAR(255),
    closest_city VARCHAR(255),
    description TEXT,
    sales_agent_name VARCHAR(255),
    sales_agent_contact VARCHAR(255),
    reservation_agent_name VARCHAR(255),
    reservation_agent_contact VARCHAR(255),
    gm_name VARCHAR(255),
    gm_contact VARCHAR(255),
    hotel_class VARCHAR(50),
    number_of_rooms INTEGER DEFAULT 0,
    disable_support VARCHAR(50) CHECK (disable_support IN ('none', 'some areas', 'full access')),
    outdoor_pool BOOLEAN DEFAULT FALSE,
    wellness BOOLEAN DEFAULT FALSE,
    business_facility BOOLEAN DEFAULT FALSE,
    parking BOOLEAN DEFAULT FALSE,
    internet BOOLEAN DEFAULT FALSE,
    airport_shuttle BOOLEAN DEFAULT FALSE,
    free_cancellation_weeks INTEGER,
    admin_approved BOOLEAN DEFAULT FALSE,
    vat_registered BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE recreations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE hotel_recreations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
    recreation_id UUID REFERENCES recreations(id) ON DELETE CASCADE NOT NULL,
    additional_charge BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hotel_id, recreation_id)
);

CREATE TABLE hotel_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
    room_name VARCHAR(255) NOT NULL,
    max_guests INTEGER DEFAULT 1,
    breakfast_included BOOLEAN DEFAULT FALSE,
    summer_start_date DATE,
    summer_end_date DATE,
    summer_bb_rate NUMERIC(10, 2),
    summer_hb_rate NUMERIC(10, 2),
    summer_fb_rate NUMERIC(10, 2),
    winter_start_date DATE,
    winter_end_date DATE,
    winter_bb_rate NUMERIC(10, 2),
    winter_hb_rate NUMERIC(10, 2),
    winter_fb_rate NUMERIC(10, 2),
    rate_received_date DATE,
    rate_years_applicable INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE activity_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    activity_type VARCHAR(100),
    location VARCHAR(255),
    description TEXT,
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE transport_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    vehicle_types TEXT[],
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(50),
    license_number VARCHAR(100),
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tour_guides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(50),
    languages TEXT[],
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-------------------------------------------------------------------------------
-- 3. Requests & Tours
-------------------------------------------------------------------------------
CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL if not registered yet? Wait, spec says "Initial requirement: Email only". Supabase Auth needs to be created.
    email VARCHAR(255), -- Store email directly for anonymous/lazy requests
    request_type VARCHAR(50) NOT NULL, -- 'package', 'custom-plan'
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Assigned', 'Active', 'Completed', 'Cancelled'
    admin_assigned_to UUID REFERENCES users(id), -- Agent ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extended structured data for custom plans
CREATE TABLE request_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE UNIQUE NOT NULL,
    package_name VARCHAR(255),
    nights INTEGER,
    estimated_price NUMERIC(10, 2),
    destinations TEXT[],
    start_date DATE,
    end_date DATE,
    adults INTEGER DEFAULT 1,
    children INTEGER DEFAULT 0,
    budget_tier VARCHAR(100),
    special_requirements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE UNIQUE NOT NULL,
    tourist_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    agent_id UUID REFERENCES users(id), -- Nullable initially? Assigned = Agent
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending', -- Mirrors request usually
    start_date DATE,
    end_date DATE,
    planner_data JSONB DEFAULT '{}'::jsonb, -- NEW: Stores full react state for builder
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tour_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID REFERENCES tours(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tour_itineraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID REFERENCES tours(id) ON DELETE CASCADE NOT NULL,
    day_number INTEGER NOT NULL,
    date DATE,
    title VARCHAR(255),
    description TEXT,
    hotel_id UUID REFERENCES hotels(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE daily_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_id UUID REFERENCES tour_itineraries(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_start TIME,
    time_end TIME,
    vendor_id UUID REFERENCES activity_vendors(id),
    transport_id UUID REFERENCES transport_providers(id),
    driver_id UUID REFERENCES drivers(id),
    guide_id UUID REFERENCES tour_guides(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-------------------------------------------------------------------------------
-- 4. Financials
-------------------------------------------------------------------------------
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID REFERENCES tours(id) ON DELETE CASCADE NOT NULL,
    tourist_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Paid', 'Cancelled'
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(100),
    payment_status VARCHAR(50) DEFAULT 'Success',
    transaction_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-------------------------------------------------------------------------------
-- 5. Vendor Ratings & Suspensions
-------------------------------------------------------------------------------
-- Generic ratings table using polymorphic relationships or simple separate flags
CREATE TABLE vendor_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID REFERENCES tours(id) ON DELETE CASCADE NOT NULL,
    agent_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    vendor_type VARCHAR(50) NOT NULL, -- 'hotel', 'vendor', 'transport', 'driver', 'guide'
    entity_id UUID NOT NULL, -- references hotel_id/vendor_id/etc
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE suspension_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    vendor_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    reviewed_by UUID REFERENCES users(id), -- admin who reviewed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-------------------------------------------------------------------------------
-- 6. Communication
-------------------------------------------------------------------------------
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID REFERENCES tours(id) ON DELETE CASCADE UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE conversation_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID REFERENCES conversation_topics(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_attachment BOOLEAN DEFAULT FALSE,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-------------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
-------------------------------------------------------------------------------

-- 0. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tourist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE recreations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_recreations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_guides ENABLE ROW LEVEL SECURITY;

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

ALTER TABLE vendor_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspension_recommendations ENABLE ROW LEVEL SECURITY;

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create helper function to check user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    user_role VARCHAR(50);
BEGIN
    SELECT r.name INTO user_role
    FROM roles r
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = $1
    LIMIT 1;
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Users & Profiles Policies
-- Admins can do everything
CREATE POLICY admin_all ON users FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY admin_all_tp ON tourist_profiles FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY admin_all_ap ON agent_profiles FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY admin_all_adp ON admin_profiles FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY admin_all_roles ON roles FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY admin_all_user_roles ON user_roles FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- Users can read their own profiles
CREATE POLICY user_read_self ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY tourist_read_update_self ON tourist_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY tourist_update_self ON tourist_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY agent_read_update_self ON agent_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY agent_update_self ON agent_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Agents and tourists need to read users for assignments etc.
CREATE POLICY users_read_auth ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY roles_read_auth ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY user_roles_read_auth ON user_roles FOR SELECT TO authenticated USING (true);


-- 2. Tours & Requests Policies
CREATE POLICY admin_tours ON tours FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY admin_requests ON requests FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY admin_req_details ON request_details FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- Tourist: insert requests (now allow anyone to insert a lead)
CREATE POLICY public_insert_requests ON requests FOR INSERT WITH CHECK (true);
CREATE POLICY public_insert_req_details ON request_details FOR INSERT WITH CHECK (true);

-- Tourist: read own tours and requests
CREATE POLICY tourist_read_tours ON tours FOR SELECT TO authenticated USING (tourist_id = auth.uid() AND get_user_role(auth.uid()) = 'tourist');
CREATE POLICY tourist_read_requests ON requests FOR SELECT TO authenticated USING (tourist_id = auth.uid() AND get_user_role(auth.uid()) = 'tourist');
CREATE POLICY tourist_update_requests ON requests FOR UPDATE TO authenticated USING (tourist_id = auth.uid() AND get_user_role(auth.uid()) = 'tourist');

-- Agent: read/update assigned tours and requests
CREATE POLICY agent_read_tours ON tours FOR SELECT TO authenticated USING (agent_id = auth.uid() AND get_user_role(auth.uid()) = 'agent');
CREATE POLICY agent_update_tours ON tours FOR UPDATE TO authenticated USING (agent_id = auth.uid() AND get_user_role(auth.uid()) = 'agent');
CREATE POLICY agent_read_requests ON requests FOR SELECT TO authenticated USING (admin_assigned_to = auth.uid() AND get_user_role(auth.uid()) = 'agent');

-- Apply similarly for itineraries and activities (checking tour owner/agent)
CREATE POLICY admin_itineraries ON tour_itineraries FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY admin_activities ON daily_activities FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- Agents can manage itineraries for their tours
CREATE POLICY agent_manage_itineraries ON tour_itineraries FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM tours WHERE id = tour_itineraries.tour_id AND agent_id = auth.uid())
);
CREATE POLICY agent_manage_activities ON daily_activities FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM tour_itineraries ti JOIN tours t ON ti.tour_id = t.id WHERE ti.id = daily_activities.itinerary_id AND t.agent_id = auth.uid())
);

-- Tourists can read their tour itineraries
CREATE POLICY tourist_read_itineraries ON tour_itineraries FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM tours WHERE id = tour_itineraries.tour_id AND tourist_id = auth.uid())
);
CREATE POLICY tourist_read_activities ON daily_activities FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM tour_itineraries ti JOIN tours t ON ti.tour_id = t.id WHERE ti.id = daily_activities.itinerary_id AND t.tourist_id = auth.uid())
);


-- 3. Financials Policies
CREATE POLICY admin_financials ON invoices FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY admin_invoice_items ON invoice_items FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY admin_payments ON payments FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- Tourist read own invoices
CREATE POLICY tourist_read_invoices ON invoices FOR SELECT TO authenticated USING (tourist_id = auth.uid());
CREATE POLICY tourist_read_invoice_items ON invoice_items FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM invoices WHERE id = invoice_items.invoice_id AND tourist_id = auth.uid())
);
CREATE POLICY tourist_read_payments ON payments FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM invoices WHERE id = payments.invoice_id AND tourist_id = auth.uid())
);


-- 4. Communication Policies
CREATE POLICY admin_conversations ON conversations FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY admin_topics ON conversation_topics FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY admin_messages ON messages FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- Tourist & Agent Chat access
CREATE POLICY chat_read_conversations ON conversations FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM tours WHERE id = conversations.tour_id AND (tourist_id = auth.uid() OR agent_id = auth.uid()))
);
CREATE POLICY chat_read_topics ON conversation_topics FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM conversations c JOIN tours t ON c.tour_id = t.id WHERE c.id = conversation_topics.conversation_id AND (t.tourist_id = auth.uid() OR t.agent_id = auth.uid()))
);
CREATE POLICY chat_manage_topics ON conversation_topics FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM conversations c JOIN tours t ON c.tour_id = t.id WHERE c.id = conversation_topics.conversation_id AND (t.tourist_id = auth.uid() OR t.agent_id = auth.uid()))
);
CREATE POLICY chat_read_messages ON messages FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM conversation_topics ct JOIN conversations c ON ct.conversation_id = c.id JOIN tours t ON c.tour_id = t.id WHERE ct.id = messages.topic_id AND (t.tourist_id = auth.uid() OR t.agent_id = auth.uid()))
);
CREATE POLICY chat_insert_messages ON messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());


-- 5. Vendor & Suspensions
CREATE POLICY public_read_vendors ON hotels FOR SELECT TO authenticated USING (is_suspended = FALSE OR get_user_role(auth.uid()) IN ('admin', 'agent'));
CREATE POLICY public_read_activities ON activity_vendors FOR SELECT TO authenticated USING (is_suspended = FALSE OR get_user_role(auth.uid()) IN ('admin', 'agent'));
CREATE POLICY public_read_transports ON transport_providers FOR SELECT TO authenticated USING (is_suspended = FALSE OR get_user_role(auth.uid()) IN ('admin', 'agent'));
CREATE POLICY public_read_drivers ON drivers FOR SELECT TO authenticated USING (is_suspended = FALSE OR get_user_role(auth.uid()) IN ('admin', 'agent'));
CREATE POLICY public_read_guides ON tour_guides FOR SELECT TO authenticated USING (is_suspended = FALSE OR get_user_role(auth.uid()) IN ('admin', 'agent'));

CREATE POLICY admin_manage_hotels ON hotels FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY public_read_recreations ON recreations FOR SELECT USING (true);
CREATE POLICY admin_manage_recreations ON recreations FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY public_read_hotel_recreations ON hotel_recreations FOR SELECT TO authenticated USING (true);
CREATE POLICY admin_manage_hotel_recreations ON hotel_recreations FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY agent_manage_hotel_recreations ON hotel_recreations FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'agent');

CREATE POLICY public_read_hotel_rooms ON hotel_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY admin_manage_hotel_rooms ON hotel_rooms FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY agent_manage_hotel_rooms ON hotel_rooms FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'agent');

CREATE POLICY admin_manage_acts ON activity_vendors FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY admin_manage_trans ON transport_providers FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY admin_manage_drivers ON drivers FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY admin_manage_guides ON tour_guides FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- Agents can rate vendors
CREATE POLICY agent_insert_ratings ON vendor_ratings FOR INSERT TO authenticated WITH CHECK (agent_id = auth.uid() AND get_user_role(auth.uid()) = 'agent');
CREATE POLICY agent_read_ratings ON vendor_ratings FOR SELECT TO authenticated USING (agent_id = auth.uid() OR get_user_role(auth.uid()) = 'admin');

-- Agents recommend suspension
CREATE POLICY agent_insert_suspensions ON suspension_recommendations FOR INSERT TO authenticated WITH CHECK (agent_id = auth.uid() AND get_user_role(auth.uid()) = 'agent');
CREATE POLICY admin_manage_suspensions ON suspension_recommendations FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-------------------------------------------------------------------------------
-- 7. Automated Triggers for Data Integrity
-------------------------------------------------------------------------------

-- Trigger 1: Sync new Supabase Auth users to our public tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    tourist_role_id UUID;
BEGIN
    -- 1. Insert into public.users
    INSERT INTO public.users (id, email)
    VALUES (new.id, new.email);
    
    -- 2. Get the tourist role ID
    SELECT id INTO tourist_role_id FROM public.roles WHERE name = 'tourist' LIMIT 1;
    
    -- 3. Assign role
    IF tourist_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (new.id, tourist_role_id);
    END IF;
    
    -- 4. Create an empty tourist profile
    INSERT INTO public.tourist_profiles (id)
    VALUES (new.id);
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger 2: Automatically link new requests to a user ID based on email
CREATE OR REPLACE FUNCTION public.link_request_to_user()
RETURNS trigger AS $$
DECLARE
    matched_user_id UUID;
BEGIN
    -- If the tourist_id is already provided, skip
    IF new.tourist_id IS NOT NULL THEN
        RETURN new;
    END IF;

    -- Find user by email
    SELECT id INTO matched_user_id FROM public.users WHERE email = new.email LIMIT 1;
    
    -- If found, attach the user id
    IF matched_user_id IS NOT NULL THEN
        new.tourist_id := matched_user_id;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_request_created_link_user ON public.requests;
CREATE TRIGGER on_request_created_link_user
    BEFORE INSERT ON public.requests
    FOR EACH ROW EXECUTE FUNCTION public.link_request_to_user();


------------------------------------
-- UPDATE REQUEST TABLE
------------------------------------
-- 1. Add the email column to store contact info
ALTER TABLE requests ADD COLUMN email VARCHAR(255);

-- 2. Allow anonymous users to submit requests and request details
CREATE POLICY public_insert_requests ON requests FOR INSERT WITH CHECK (true);
CREATE POLICY public_insert_req_details ON request_details FOR INSERT WITH CHECK (true);

-- Allow public reads for Development (Mock Admin Dashboard)
CREATE POLICY public_read_requests_dev ON requests FOR SELECT USING (true);
CREATE POLICY public_read_req_details_dev ON request_details FOR SELECT USING (true);

-- 1. Drop the old restrictive policy that requires authentication
DROP POLICY IF EXISTS tourist_insert_requests ON requests;

-- 2. Ensure the public policy is created (in case it failed before)
DROP POLICY IF EXISTS public_insert_requests ON requests;
CREATE POLICY public_insert_requests ON requests FOR INSERT WITH CHECK (true);

-- 3. Ensure the details public policy is created
DROP POLICY IF EXISTS public_insert_req_details ON request_details;
CREATE POLICY public_insert_req_details ON request_details FOR INSERT WITH CHECK (true);

-------------------------------------------------------------------------------
-- End of Schema
-------------------------------------------------------------------------------

-------------------------------------------------------------------------------
-- 7. Automated Triggers for Data Integrity
-------------------------------------------------------------------------------

-- Trigger 1: Sync new Supabase Auth users to our public tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    tourist_role_id UUID;
BEGIN
    -- 1. Insert into public.users
    INSERT INTO public.users (id, email)
    VALUES (new.id, new.email);
    
    -- 2. Get the tourist role ID
    SELECT id INTO tourist_role_id FROM public.roles WHERE name = 'tourist' LIMIT 1;
    
    -- 3. Assign role
    IF tourist_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (new.id, tourist_role_id);
    END IF;
    
    -- 4. Create an empty tourist profile
    INSERT INTO public.tourist_profiles (id)
    VALUES (new.id);
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY public_read_requests_dev ON requests FOR SELECT USING (true);
CREATE POLICY public_read_req_details_dev ON request_details FOR SELECT USING (true);
