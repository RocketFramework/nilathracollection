ALTER TABLE tour_guides ADD COLUMN daily_rate DECIMAL(10, 2) DEFAULT 20.00;
-- Update existing tour guides to have the default rate
UPDATE tour_guides SET daily_rate = 20.00 WHERE daily_rate IS NULL;
