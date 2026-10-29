-- Readable tour code: TR-<YYYY>-<0001>, a running number per year, shared by POs, invoices and vouchers.
-- Reuses public.po_number_counters (created in add_sequential_po_numbers.sql) with prefix 'TR'.

ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS tour_code text;

CREATE OR REPLACE FUNCTION public.next_tour_code()
RETURNS text AS $$
DECLARE
  v_year integer := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
  v_next integer;
BEGIN
  INSERT INTO public.po_number_counters AS c (prefix, year, last_value)
  VALUES ('TR', v_year, 1)
  ON CONFLICT (prefix, year) DO UPDATE SET last_value = c.last_value + 1
  RETURNING c.last_value INTO v_next;

  RETURN 'TR-' || v_year || '-' || LPAD(v_next::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Back-fill existing tours (oldest first, numbered within the year they were created).
WITH numbered AS (
  SELECT id,
         EXTRACT(YEAR FROM created_at)::integer AS yr,
         ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM created_at) ORDER BY created_at, id) AS rn
  FROM public.tours
  WHERE tour_code IS NULL
)
UPDATE public.tours t
SET tour_code = 'TR-' || n.yr || '-' || LPAD(n.rn::text, 4, '0')
FROM numbered n
WHERE t.id = n.id;

-- Make the counters continue after the back-filled numbers.
INSERT INTO public.po_number_counters (prefix, year, last_value)
SELECT 'TR', SUBSTRING(tour_code FROM 4 FOR 4)::integer, MAX(SUBSTRING(tour_code FROM 9)::integer)
FROM public.tours
WHERE tour_code ~ '^TR-[0-9]{4}-[0-9]+$'
GROUP BY SUBSTRING(tour_code FROM 4 FOR 4)
ON CONFLICT (prefix, year) DO UPDATE SET last_value = GREATEST(public.po_number_counters.last_value, EXCLUDED.last_value);

CREATE UNIQUE INDEX IF NOT EXISTS tours_tour_code_key ON public.tours (tour_code);

-- New tours get a code automatically.
CREATE OR REPLACE FUNCTION public.assign_tour_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tour_code := public.next_tour_code();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_tour_code ON public.tours;
CREATE TRIGGER trg_assign_tour_code
BEFORE INSERT ON public.tours
FOR EACH ROW
WHEN (NEW.tour_code IS NULL OR NEW.tour_code = '')
EXECUTE FUNCTION public.assign_tour_code();
