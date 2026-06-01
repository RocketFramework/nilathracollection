-- Add activity_type column to daily_activities table
ALTER TABLE public.daily_activities 
ADD COLUMN IF NOT EXISTS activity_type VARCHAR(50);
