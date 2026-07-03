-- Migration: Add service_fee_percentage column to customer_invoices table
ALTER TABLE public.customer_invoices
  ADD COLUMN IF NOT EXISTS service_fee_percentage NUMERIC(5, 2);
