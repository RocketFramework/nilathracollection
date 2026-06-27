-- Rename replied_date to updated_at on tour_rfq_emails and tour_rfp_emails
-- This repurposes the field to track when any edit (status change, price, notes) was last saved.

ALTER TABLE public.tour_rfq_emails
RENAME COLUMN replied_date TO updated_at;

ALTER TABLE public.tour_rfp_emails
RENAME COLUMN replied_date TO updated_at;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
