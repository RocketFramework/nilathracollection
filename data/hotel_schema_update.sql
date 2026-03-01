-- Update existing hotels table with new fields
ALTER TABLE hotels ADD COLUMN sales_agent_name VARCHAR(255);
ALTER TABLE hotels ADD COLUMN sales_agent_contact VARCHAR(255);
ALTER TABLE hotels ADD COLUMN reservation_agent_name VARCHAR(255);
ALTER TABLE hotels ADD COLUMN reservation_agent_contact VARCHAR(255);
ALTER TABLE hotels ADD COLUMN gm_name VARCHAR(255);
ALTER TABLE hotels ADD COLUMN gm_contact VARCHAR(255);
ALTER TABLE hotels ADD COLUMN hotel_class VARCHAR(50);
ALTER TABLE hotels ADD COLUMN number_of_rooms INTEGER DEFAULT 0;
ALTER TABLE hotels ADD COLUMN disable_support VARCHAR(50) CHECK (disable_support IN ('none', 'some areas', 'full access'));
ALTER TABLE hotels ADD COLUMN outdoor_pool BOOLEAN DEFAULT FALSE;
ALTER TABLE hotels ADD COLUMN wellness BOOLEAN DEFAULT FALSE;
ALTER TABLE hotels ADD COLUMN business_facility BOOLEAN DEFAULT FALSE;
ALTER TABLE hotels ADD COLUMN parking BOOLEAN DEFAULT FALSE;
ALTER TABLE hotels ADD COLUMN internet BOOLEAN DEFAULT FALSE;
ALTER TABLE hotels ADD COLUMN airport_shuttle BOOLEAN DEFAULT FALSE;
ALTER TABLE hotels ADD COLUMN free_cancellation_weeks INTEGER;
ALTER TABLE hotels ADD COLUMN admin_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE hotels ADD COLUMN vat_registered BOOLEAN DEFAULT FALSE;

-- Create Recreations Table
CREATE TABLE recreations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial Recreations Insert
INSERT INTO recreations (name) VALUES
('Bicycle rental'),
('Live sport events (broadcast)'),
('Live music/performance'),
('Tour or class about local culture'),
('Themed dinner nights'),
('Bike tours'),
('Walking tours'),
('Badminton equipment'),
('Tennis equipment'),
('Evening entertainment'),
('Entertainment staff'),
('Cycling'),
('Hiking'),
('Darts'),
('Table tennis'),
('Billiards'),
('Games room'),
('Tennis court')
ON CONFLICT (name) DO NOTHING;

-- Create Hotel Recreations map
CREATE TABLE hotel_recreations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
    recreation_id UUID REFERENCES recreations(id) ON DELETE CASCADE NOT NULL,
    additional_charge BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hotel_id, recreation_id)
);

-- Create Hotel Rooms
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

-- Enable RLS
ALTER TABLE recreations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_recreations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_rooms ENABLE ROW LEVEL SECURITY;

-- Reading Recreations is public
CREATE POLICY public_read_recreations ON recreations FOR SELECT USING (true);
CREATE POLICY admin_manage_recreations ON recreations FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- Hotel Recreations are readable if hotel is readable
CREATE POLICY public_read_hotel_recreations ON hotel_recreations FOR SELECT TO authenticated USING (true);
CREATE POLICY admin_manage_hotel_recreations ON hotel_recreations FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY agent_manage_hotel_recreations ON hotel_recreations FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'agent');

-- Hotel Rooms are readable if hotel is readable
CREATE POLICY public_read_hotel_rooms ON hotel_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY admin_manage_hotel_rooms ON hotel_rooms FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY agent_manage_hotel_rooms ON hotel_rooms FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'agent');
