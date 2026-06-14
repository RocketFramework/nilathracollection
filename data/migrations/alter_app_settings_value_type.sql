-- SQL migration to alter the app_settings.setting_value column type from NUMERIC to TEXT.
-- This allows storing both numeric rates/markups and text-based policy notes.
--
-- Please execute this query in your Supabase SQL Editor:
ALTER TABLE public.app_settings ALTER COLUMN setting_value TYPE TEXT;
