-- Add has_finalized column to public.po_blocks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'po_blocks' AND column_name = 'has_finalized'
    ) THEN
        ALTER TABLE public.po_blocks 
        ADD COLUMN has_finalized BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
