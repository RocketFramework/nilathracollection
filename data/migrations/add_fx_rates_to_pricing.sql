-- Agreed USD->LKR conversion rate (entered manually per booking in the final track).
-- One rate applies to both the unit and total price; LKR amounts are saved alongside the USD values.
ALTER TABLE public.daily_activities
  ADD COLUMN IF NOT EXISTS contracted_fx_rate NUMERIC(12, 4) NULL,
  ADD COLUMN IF NOT EXISTS contracted_unit_price_lkr NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS contracted_total_price_lkr NUMERIC(14, 2) NULL;

ALTER TABLE public.purchase_order_items
  ADD COLUMN IF NOT EXISTS fx_rate NUMERIC(12, 4) NULL,
  ADD COLUMN IF NOT EXISTS unit_price_lkr NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS total_price_lkr NUMERIC(14, 2) NULL;

-- Only needed if you already ran the earlier two-rate version of this script:
-- ALTER TABLE public.daily_activities DROP COLUMN IF EXISTS contracted_unit_fx_rate, DROP COLUMN IF EXISTS contracted_total_fx_rate;
-- ALTER TABLE public.purchase_order_items DROP COLUMN IF EXISTS unit_fx_rate, DROP COLUMN IF EXISTS total_fx_rate;

-- Driver-selection step: one agreed rate per driver-day and the resulting LKR total.
ALTER TABLE public.tour_itinerary_drivers
  ADD COLUMN IF NOT EXISTS contracted_fx_rate NUMERIC(12, 4) NULL,
  ADD COLUMN IF NOT EXISTS contracted_total_lkr NUMERIC(14, 2) NULL;
