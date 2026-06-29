-- 1. Add service_details JSONB column to purchase_order_items
ALTER TABLE public.purchase_order_items 
ADD COLUMN IF NOT EXISTS service_details JSONB DEFAULT '{}'::jsonb;

-- 2. Migrate existing data from old columns to service_details
UPDATE public.purchase_order_items
SET service_details = jsonb_strip_nulls(jsonb_build_object(
  'check_in_date', check_in_date,
  'check_out_date', check_out_date,
  'room_type', room_type,
  'meal_plan', meal_plan,
  'number_of_nights', number_of_nights,
  'vehicle_type', vehicle_type,
  'pick_up_location', pick_up_location,
  'drop_off_location', drop_off_location,
  'driver_included', driver_included,
  'fuel_included', fuel_included,
  'number_of_guests', number_of_guests,
  'language', language
))
WHERE service_details IS NULL OR service_details = '{}'::jsonb;

-- 3. Drop obsolete columns
ALTER TABLE public.purchase_order_items
DROP COLUMN IF EXISTS check_in_date,
DROP COLUMN IF EXISTS check_out_date,
DROP COLUMN IF EXISTS room_type,
DROP COLUMN IF EXISTS meal_plan,
DROP COLUMN IF EXISTS number_of_nights,
DROP COLUMN IF EXISTS vehicle_type,
DROP COLUMN IF EXISTS pick_up_location,
DROP COLUMN IF EXISTS drop_off_location,
DROP COLUMN IF EXISTS driver_included,
DROP COLUMN IF EXISTS fuel_included,
DROP COLUMN IF EXISTS number_of_guests,
DROP COLUMN IF EXISTS language;

-- 4. Create GIN index on service_details column
CREATE INDEX IF NOT EXISTS idx_po_items_service_details ON public.purchase_order_items USING gin (service_details);
