ALTER TABLE tour_itinerary_concierges ADD COLUMN IF NOT EXISTS charged_cost numeric;

-- One-time backfill: before this column existed the saved `cost` was the amount shown to the customer.
UPDATE tour_itinerary_concierges SET charged_cost = cost WHERE charged_cost IS NULL;
