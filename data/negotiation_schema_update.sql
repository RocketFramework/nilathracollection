-- Migration: Add explicit relational vectors capturing diverse room compositions into single day tracker arrays
ALTER TABLE daily_activities 
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id);

ALTER TABLE daily_activities 
ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES hotels(id),
ADD COLUMN IF NOT EXISTS single_room_id UUID REFERENCES hotel_rooms(id),
ADD COLUMN IF NOT EXISTS single_room_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS double_room_id UUID REFERENCES hotel_rooms(id),
ADD COLUMN IF NOT EXISTS double_room_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS twin_room_id UUID REFERENCES hotel_rooms(id),
ADD COLUMN IF NOT EXISTS twin_room_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS triple_room_id UUID REFERENCES hotel_rooms(id),
ADD COLUMN IF NOT EXISTS triple_room_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS family_room_id UUID REFERENCES hotel_rooms(id),
ADD COLUMN IF NOT EXISTS family_room_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS agreed_total_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS meal_plan VARCHAR(50);
