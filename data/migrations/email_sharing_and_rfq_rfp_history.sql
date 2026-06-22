-- 1. Add type column to tour_shared_emails
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'tour_shared_emails' 
          AND column_name = 'type'
    ) THEN
        ALTER TABLE public.tour_shared_emails ADD COLUMN type character varying(50) DEFAULT 'share-tourist';
    END IF;
END $$;

-- 2. Create tour_rfq_emails table
CREATE TABLE IF NOT EXISTS public.tour_rfq_emails (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  tour_id uuid NOT NULL,
  vendor_id uuid,
  recipient_email character varying(255) NOT NULL,
  sender_email character varying(255) NOT NULL,
  subject character varying(255) NOT NULL,
  body_html text NOT NULL,
  attachments jsonb NULL DEFAULT '[]'::jsonb,
  sent_at timestamp with time zone NULL DEFAULT now(),
  sent_by uuid NULL,
  quotation_request_id uuid,
  CONSTRAINT tour_rfq_emails_pkey PRIMARY KEY (id),
  CONSTRAINT tour_rfq_emails_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT tour_rfq_emails_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES tours (id) ON DELETE CASCADE,
  CONSTRAINT tour_rfq_emails_quotation_request_id_fkey FOREIGN KEY (quotation_request_id) REFERENCES public.quotation_request (id) ON DELETE SET NULL
);

-- 3. Create tour_rfp_emails table
CREATE TABLE IF NOT EXISTS public.tour_rfp_emails (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  tour_id uuid NOT NULL,
  purchase_order_id uuid,
  recipient_email character varying(255) NOT NULL,
  sender_email character varying(255) NOT NULL,
  subject character varying(255) NOT NULL,
  body_html text NOT NULL,
  attachments jsonb NULL DEFAULT '[]'::jsonb,
  sent_at timestamp with time zone NULL DEFAULT now(),
  sent_by uuid NULL,
  CONSTRAINT tour_rfp_emails_pkey PRIMARY KEY (id),
  CONSTRAINT tour_rfp_emails_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT tour_rfp_emails_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES tours (id) ON DELETE CASCADE,
  CONSTRAINT tour_rfp_emails_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders (id) ON DELETE CASCADE
);
