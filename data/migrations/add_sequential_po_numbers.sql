-- Sequential purchase order numbers: PO-<PREFIX>-<YYYY>-<0001>, one counter per prefix per year.
-- Prefixes: HOT (hotel), RES (restaurant), GUI (guide), DRI (driver), TRA (transport), ACT (activity / other).

CREATE TABLE IF NOT EXISTS public.po_number_counters (
  prefix text NOT NULL,
  year integer NOT NULL,
  last_value integer NOT NULL DEFAULT 0,
  CONSTRAINT po_number_counters_pkey PRIMARY KEY (prefix, year)
);

-- Atomically reserves and returns the next number for a prefix (safe under concurrent calls).
CREATE OR REPLACE FUNCTION public.next_po_number(p_prefix text)
RETURNS text AS $$
DECLARE
  v_year integer := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
  v_next integer;
BEGIN
  INSERT INTO public.po_number_counters AS c (prefix, year, last_value)
  VALUES (upper(p_prefix), v_year, 1)
  ON CONFLICT (prefix, year) DO UPDATE SET last_value = c.last_value + 1
  RETURNING c.last_value INTO v_next;

  RETURN 'PO-' || upper(p_prefix) || '-' || v_year || '-' || LPAD(v_next::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger: any PO inserted without a number gets the next sequential one for its vendor type.
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TRIGGER AS $$
DECLARE
  v_prefix text;
BEGIN
  v_prefix := CASE NEW.vendor_type
    WHEN 'hotel' THEN 'HOT'
    WHEN 'restaurant' THEN 'RES'
    WHEN 'guide' THEN 'GUI'
    WHEN 'tour_guide' THEN 'GUI'
    WHEN 'driver' THEN 'DRI'
    WHEN 'transport' THEN 'TRA'
    WHEN 'transport_provider' THEN 'TRA'
    ELSE 'ACT'
  END;
  NEW.po_number := public.next_po_number(v_prefix);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_po_number ON public.purchase_orders;
CREATE TRIGGER trg_generate_po_number
BEFORE INSERT ON public.purchase_orders
FOR EACH ROW
WHEN (NEW.po_number IS NULL OR NEW.po_number = '')
EXECUTE FUNCTION public.generate_po_number();

-- Existing timestamp-style numbers (e.g. PO-DRI-346880) are left untouched; counters start at 0001 in the new format.
