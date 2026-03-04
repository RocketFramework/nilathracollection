-- Migration: Advanced Relational Purchase Order System

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-------------------------------------------------------------------------------
-- 4. Finance & Accounting Details (Advanced PO System)
-------------------------------------------------------------------------------

-- Drop if exists (use with caution)
-- DROP TABLE IF EXISTS vendor_payments CASCADE;
-- DROP TABLE IF EXISTS vendor_invoices CASCADE;
-- DROP TABLE IF EXISTS purchase_order_items CASCADE;
-- DROP TABLE IF EXISTS purchase_orders CASCADE;

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
    po_number VARCHAR(255) UNIQUE NOT NULL, -- Auto-generated like PO-2024-0001
    po_date DATE DEFAULT CURRENT_DATE,
    
    -- Specific Vendor References
    hotel_id UUID REFERENCES hotels(id),
    activity_vendor_id UUID REFERENCES vendors(id),
    transport_provider_id UUID REFERENCES transport_providers(id),
    guide_id UUID REFERENCES tour_guides(id),
    restaurant_id UUID REFERENCES restaurants(id),
    
    vendor_type VARCHAR(50), -- 'hotel', 'vendor', 'transport', 'guide', 'restaurant', 'other'
    
    currency VARCHAR(10) DEFAULT 'LKR',
    payment_terms TEXT,
    status VARCHAR(50) DEFAULT 'Draft', -- Draft, Pending Confirmation, Sent, Accepted, Rejected, Cancelled, Completed
    
    -- Financials 
    subtotal NUMERIC(12, 2) DEFAULT 0,
    discount NUMERIC(12, 2) DEFAULT 0,
    tax NUMERIC(12, 2) DEFAULT 0,
    service_charge NUMERIC(12, 2) DEFAULT 0,
    total_amount NUMERIC(12, 2) DEFAULT 0,
    advance_paid NUMERIC(12, 2) DEFAULT 0,
    balance_payable NUMERIC(12, 2) GENERATED ALWAYS AS (total_amount - advance_paid) STORED,
    
    internal_notes TEXT,
    vendor_notes TEXT,
    cancellation_policy TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE NOT NULL,
    tour_itinerary_id UUID REFERENCES tour_itineraries(id) ON DELETE SET NULL, -- Links line item to Itinerary Block
    
    -- Generic Fields
    description TEXT NOT NULL,
    service_date DATE,
    quantity NUMERIC(10, 2) DEFAULT 1,
    unit_price NUMERIC(12, 2) DEFAULT 0,
    total_price NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

    -- Hotel specific
    check_in_date DATE,
    check_out_date DATE,
    room_type VARCHAR(100),
    meal_plan VARCHAR(50),
    number_of_nights INTEGER,

    -- Transport specific
    vehicle_type VARCHAR(100),
    pick_up_location TEXT,
    drop_off_location TEXT,
    driver_included BOOLEAN,
    fuel_included BOOLEAN,

    -- Activity/Guide specific
    number_of_guests INTEGER,
    language VARCHAR(100),
    
    special_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE vendor_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    invoice_number VARCHAR(255) NOT NULL,
    invoice_date DATE,
    due_date DATE,
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Received, Partial Paid, Paid, Confirmed
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE vendor_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_invoice_id UUID REFERENCES vendor_invoices(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(100), -- Bank Transfer, Cash, Card, Cheque
    payment_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX idx_po_tour_id ON purchase_orders(tour_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_invoices_po_id ON vendor_invoices(purchase_order_id);

-- Sequence and function for auto PO Numbering
CREATE SEQUENCE IF NOT EXISTS po_number_seq;

CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix TEXT;
    next_val BIGINT;
BEGIN
    year_prefix := to_char(CURRENT_DATE, 'YYYY');
    SELECT nextval('po_number_seq') INTO next_val;
    NEW.po_number := 'PO-' || year_prefix || '-' || LPAD(next_val::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_po_number
BEFORE INSERT ON purchase_orders
FOR EACH ROW
WHEN (NEW.po_number IS NULL OR NEW.po_number = '')
EXECUTE FUNCTION generate_po_number();
