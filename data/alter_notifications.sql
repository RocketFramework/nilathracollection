ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS reference_type TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS reference_id TEXT;
