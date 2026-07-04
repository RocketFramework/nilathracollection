-- Migration: Rename accepted_by_name → informed_by_name and accepted_date → informed_date
-- These columns track who informed the agency of the PO outcome (acceptance, decline, etc.)

ALTER TABLE purchase_orders
  RENAME COLUMN accepted_by_name TO informed_by_name;

ALTER TABLE purchase_orders
  RENAME COLUMN accepted_date TO informed_date;
