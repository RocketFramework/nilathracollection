-- Migration: Drop transport_requirements table, transport_requirement_vehicles junction table, and foreign key columns

DROP TABLE IF EXISTS public.transport_requirement_vehicles CASCADE;
DROP TABLE IF EXISTS public.transport_requirements CASCADE;
DROP TABLE IF EXISTS public.purchase_order_daily_transport_items CASCADE;

ALTER TABLE public.daily_activities DROP COLUMN IF EXISTS transport_requirement_id;
ALTER TABLE public.daily_activities DROP COLUMN IF EXISTS transport_id;
ALTER TABLE public.daily_activities DROP COLUMN IF EXISTS driver_id;
