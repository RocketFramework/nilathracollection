-- Insert initial master roles
INSERT INTO roles (name, description) VALUES 
('tourist', 'Standard tourist account for booking and managing tours'),
('agent', 'Travel Agent for handling requests and organizing itineraries'),
('admin', 'Administrator with master access to all platform features');

-- Since users table relies on Supabase Auth, we can't directly insert auth.users via SQL without the Supabase admin API or knowing the exact hashing algorithms for passwords (often managed internally by Gotrue). 
-- For dummy data purposes in a local test, if auth.users are already manually created, you'd link them:
-- INSERT INTO users (id, email) VALUES ...
-- INSERT INTO user_roles (user_id, role_id) VALUES ...

-- Example dummy hotels
INSERT INTO hotels (name, location, description) VALUES
('The Grand Colombo', 'Colombo, Sri Lanka', 'Luxury 5-star hotel in the heart of Colombo'),
('Kandy Heritage Resort', 'Kandy, Sri Lanka', 'Boutique resort overlooking the Kandy Lake'),
('Galle Fort Spa & Suites', 'Galle, Sri Lanka', 'Historic luxury suites inside the Galle Fort'),
('Sigiriya Rock View', 'Sigiriya, Sri Lanka', 'Eco-lodge with direct views of the Lion Rock');

-- Example activity vendors
INSERT INTO activity_vendors (name, activity_type, location, description) VALUES
('Wilderness Safari Co.', 'Wildlife Safari', 'Yala National Park', 'Premium jeep safaris in Yala'),
('Lanka Surf School', 'Surfing', 'Arugam Bay', 'Professional surf lessons and board rentals'),
('Ceylon Tea Trails Experience', 'Cultural Tour', 'Nuwara Eliya', 'Guided tea factory tours and tasting'),
('Ocean Blue Whale Watchers', 'Whale Watching', 'Mirissa', 'Safe and responsible whale watching tours');

-- Example transport providers
INSERT INTO transport_providers (name, vehicle_types) VALUES
('Lanka Premium Cabs', ARRAY['Sedan', 'SUV']),
('Island Wide Transit', ARRAY['Minivan', 'Bus', 'Luxury Coach']),
('Colombo Express', ARRAY['Sedan']);

-- Example drivers
INSERT INTO drivers (first_name, last_name, phone, license_number) VALUES
('Sunil', 'Perera', '+94771234567', 'DL-12345'),
('Kamal', 'Silva', '+94719876543', 'DL-98765'),
('Nimal', 'Fernando', '+94765554443', 'DL-55555');

-- Example tour guides
INSERT INTO tour_guides (first_name, last_name, phone, languages) VALUES
('Malini', 'Fonseka', '+94772223334', ARRAY['English', 'French']),
('Ruwan', 'Rajapakse', '+94713334445', ARRAY['English', 'German', 'Russian']),
('Saman', 'Kumara', '+94764445556', ARRAY['English', 'Mandarin']);

-- Instructions for hooking up auth users manually during dev:
/*
1. Sign up 3 users via the Supabase Dashboard / Auth UI 
   (e.g., admin@nilathra.com, agent@nilathra.com, tourist@nilathra.com)
2. Copy their UUIDs from `auth.users`
3. Execute the following in SQL Editor (replace UUIDs):

INSERT INTO users (id, email) VALUES
('UUID_ADMIN', 'admin@nilathra.com'),
('UUID_AGENT', 'agent@nilathra.com'),
('UUID_TOURIST', 'tourist@nilathra.com');

INSERT INTO admin_profiles (id, first_name, last_name, is_super_admin) VALUES
('UUID_ADMIN', 'Super', 'Admin', TRUE);

INSERT INTO agent_profiles (id, first_name, last_name) VALUES
('UUID_AGENT', 'Travel', 'Agent');

INSERT INTO tourist_profiles (id, first_name, last_name) VALUES
('UUID_TOURIST', 'John', 'Doe');

INSERT INTO user_roles (user_id, role_id) VALUES
('UUID_ADMIN', (SELECT id FROM roles WHERE name='admin')),
('UUID_AGENT', (SELECT id FROM roles WHERE name='agent')),
('UUID_TOURIST', (SELECT id FROM roles WHERE name='tourist'));
*/
