-- Update hotel_rooms table to support room standard
ALTER TABLE public.hotel_rooms 
ADD COLUMN IF NOT EXISTS room_standard VARCHAR(255);
