-- Add contracted_total_price to daily_activities table
ALTER TABLE public.daily_activities 
ADD COLUMN IF NOT EXISTS contracted_total_price NUMERIC(10, 2) NULL;
