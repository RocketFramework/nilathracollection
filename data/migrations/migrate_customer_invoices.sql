-- SQL Migration: Add columns to customer_invoices table for experience category billing
ALTER TABLE public.customer_invoices 
  ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS billing_details JSONB,
  ADD COLUMN IF NOT EXISTS agency_note TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10, 2) DEFAULT 0.00;
