-- Migration: Create tour_itinerary_vehicles table and update constraints for multi-allocation

-- Drop any unique constraints on tour_itinerary_id to allow multi-allocations per day
ALTER TABLE public.tour_itinerary_drivers DROP CONSTRAINT IF EXISTS tour_itinerary_drivers_tour_itinerary_id_key;
ALTER TABLE public.tour_itinerary_transports DROP CONSTRAINT IF EXISTS tour_itinerary_transports_tour_itinerary_id_key;

DROP INDEX IF EXISTS public.tour_itinerary_drivers_tour_itinerary_id_key;
DROP INDEX IF EXISTS public.tour_itinerary_transports_tour_itinerary_id_key;

-- Create tour_itinerary_vehicles table
CREATE TABLE IF NOT EXISTS public.tour_itinerary_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE,
    tour_itinerary_id UUID REFERENCES public.tour_itineraries(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.transport_vehicles(id) ON DELETE SET NULL,
    
    -- Contracted Cost (buying)
    contracted_per_day_rate NUMERIC(12,2) DEFAULT 0.00,
    contracted_excess_mileage_cost NUMERIC(12,2) DEFAULT 0.00,
    contracted_other_allowance NUMERIC(12,2) DEFAULT 0.00,
    
    -- Charged Price (selling)
    charged_per_day_rate NUMERIC(12,2) DEFAULT 0.00,
    charged_excess_mileage_cost NUMERIC(12,2) DEFAULT 0.00,
    charged_other_allowance NUMERIC(12,2) DEFAULT 0.00,
    
    route_path TEXT,
    distance_km NUMERIC(10,2) DEFAULT 0.00,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for fast lookups
CREATE INDEX IF NOT EXISTS idx_tiv_tour_id ON public.tour_itinerary_vehicles(tour_id);
CREATE INDEX IF NOT EXISTS idx_tiv_itinerary_id ON public.tour_itinerary_vehicles(tour_itinerary_id);
CREATE INDEX IF NOT EXISTS idx_tiv_vehicle_id ON public.tour_itinerary_vehicles(vehicle_id);

-- Enable RLS and setup policies
ALTER TABLE public.tour_itinerary_vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_agent_finance_all_tiv ON public.tour_itinerary_vehicles;
CREATE POLICY admin_agent_finance_all_tiv
    ON public.tour_itinerary_vehicles
    FOR ALL
    TO authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- Migrate existing non-null vehicle assignments from tour_itinerary_transports
INSERT INTO public.tour_itinerary_vehicles (
    tour_id,
    tour_itinerary_id,
    vehicle_id,
    contracted_per_day_rate,
    contracted_excess_mileage_cost,
    contracted_other_allowance,
    charged_per_day_rate,
    charged_excess_mileage_cost,
    charged_other_allowance,
    route_path,
    distance_km,
    notes,
    created_at,
    updated_at
)
SELECT 
    tour_id,
    tour_itinerary_id,
    vehicle_id,
    contracted_per_day_rate,
    contracted_excess_mileage_cost,
    contracted_other_allowance,
    charged_per_day_rate,
    charged_excess_mileage_cost,
    charged_other_allowance,
    route_path,
    distance_km,
    notes,
    created_at,
    updated_at
FROM public.tour_itinerary_transports
WHERE vehicle_id IS NOT NULL;

-- Nullify vehicle_id from tour_itinerary_transports for those migrated rows
UPDATE public.tour_itinerary_transports
SET vehicle_id = NULL
WHERE vehicle_id IS NOT NULL;
