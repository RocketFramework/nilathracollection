-- 1. Drop foreign key constraint and column on purchase_orders
ALTER TABLE public.purchase_orders 
DROP CONSTRAINT IF EXISTS purchase_orders_vendor_booking_id_fkey,
DROP COLUMN IF EXISTS vendor_booking_id;

-- 2. Drop vendor_booked_activities table
DROP TABLE IF EXISTS public.vendor_booked_activities;

-- 3. Drop vendor_bookings table
DROP TABLE IF EXISTS public.vendor_bookings;
