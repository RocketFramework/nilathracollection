-- Migration: Link transport_requirements → transport_vehicles (many-to-many)
--
-- A single transport requirement may need multiple vehicles (e.g. 2 vans + 1 SUV).
-- We model this with a junction table rather than a single vehicle_id column.

CREATE TABLE IF NOT EXISTS transport_requirement_vehicles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id  UUID NOT NULL REFERENCES transport_requirements(id) ON DELETE CASCADE,
    vehicle_id      UUID NOT NULL REFERENCES transport_vehicles(id)     ON DELETE CASCADE,
    quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),    -- how many of this vehicle type are needed
    notes           TEXT,                                               -- optional per-vehicle instructions
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent the same vehicle from being attached to the same requirement twice
    CONSTRAINT uq_requirement_vehicle UNIQUE (requirement_id, vehicle_id)
);

-- Index for efficient look-ups from the requirement side
CREATE INDEX IF NOT EXISTS idx_trv_requirement_id ON transport_requirement_vehicles (requirement_id);

-- Index for efficient look-ups from the vehicle side
CREATE INDEX IF NOT EXISTS idx_trv_vehicle_id     ON transport_requirement_vehicles (vehicle_id);
