-- Add vendor_activity_id to daily_activities table
ALTER TABLE daily_activities 
ADD COLUMN vendor_activity_id UUID REFERENCES vendor_activities(id);
