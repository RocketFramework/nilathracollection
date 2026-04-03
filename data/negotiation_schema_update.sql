-- Migration: Add missing relational references to daily_activities to synchronize payload blocks
ALTER TABLE daily_activities 
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id);

ALTER TABLE daily_activities 
ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES hotels(id),
ADD COLUMN IF NOT EXISTS hotel_room_id UUID REFERENCES hotel_rooms(id),
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS agreed_unit_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS agreed_total_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS meal_plan VARCHAR(50);
