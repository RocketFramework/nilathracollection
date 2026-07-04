-- Migration: Add separate make and model columns to transport_vehicles
-- The legacy make_and_model column is kept for backward compatibility.
-- New records will use make + model; existing records keep their make_and_model value.

ALTER TABLE transport_vehicles
  ADD COLUMN IF NOT EXISTS make               TEXT,
  ADD COLUMN IF NOT EXISTS model              TEXT,
  ADD COLUMN IF NOT EXISTS max_seat_capacity  INTEGER; -- excludes driver

-- Attempt to split existing make_and_model into make + model.
-- Strategy: first word → make, remainder → model.
UPDATE transport_vehicles
SET
  make  = SPLIT_PART(TRIM(make_and_model), ' ', 1),
  model = TRIM(SUBSTRING(TRIM(make_and_model) FROM POSITION(' ' IN TRIM(make_and_model)) + 1))
WHERE make_and_model IS NOT NULL
  AND TRIM(make_and_model) <> ''
  AND make IS NULL
  AND model IS NULL;
