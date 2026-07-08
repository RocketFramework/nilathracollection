-- Adds a simple boolean flag to tours that tracks whether the AI has regenerated
-- the itinerary since the last time PO blocks were built.
-- Set to TRUE by markItineraryRegeneratedAction (called after AI generation).
-- Set to FALSE by forceRebuildAllPODataAction (called after agent confirms rebuild).

ALTER TABLE tours
  ADD COLUMN IF NOT EXISTS itinerary_needs_po_rebuild BOOLEAN NOT NULL DEFAULT FALSE;
