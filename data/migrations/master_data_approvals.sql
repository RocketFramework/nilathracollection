-- Migration: Add master_data_approvals table for Maker-Checker workflow

CREATE TABLE IF NOT EXISTS public.master_data_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- e.g., 'hotel', 'vendor', 'restaurant', 'transport', 'driver', 'guide'
    entity_id UUID,                   -- The record ID if UPDATE, NULL if CREATE
    action VARCHAR(20) NOT NULL DEFAULT 'UPDATE', -- 'CREATE', 'UPDATE'
    proposed_data JSONB NOT NULL,
    contact_details JSONB,            -- { name: string, phone: string, email: string }
    proof_image_url TEXT,
    requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE public.master_data_approvals ENABLE ROW LEVEL SECURITY;

-- Agents can insert their own approvals
CREATE POLICY "Agents can insert approvals" ON public.master_data_approvals 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = requested_by);

-- Agents can view their own approvals
CREATE POLICY "Agents can view own approvals" ON public.master_data_approvals 
FOR SELECT TO authenticated 
USING (auth.uid() = requested_by);

-- Admins can view and update all approvals via their RLS bypass or explicit policy if needed.
-- Realistically, the Nilathra system uses createAdminClient() (Service Role Key) for admin data access.

-- Setup Storage Bucket for Payment Proofs if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload payment proofs" 
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'payment-proofs'
);

CREATE POLICY "Payment proofs are publicly accessible" 
ON storage.objects FOR SELECT TO public USING (
    bucket_id = 'payment-proofs'
);
