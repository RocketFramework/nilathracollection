-- Add gm_email column to hotels table
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS gm_email VARCHAR(255);
