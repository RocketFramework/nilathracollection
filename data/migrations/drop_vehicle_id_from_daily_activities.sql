-- Vehicle assignment is now tracked exclusively via the
-- transport_requirement_vehicles junction table.
-- These columns are no longer used by the application.

ALTER TABLE daily_activities
  DROP COLUMN IF EXISTS vehicle_id,
  DROP COLUMN IF EXISTS vehicle_count;
