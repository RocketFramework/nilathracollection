-- Create auth_policies table
CREATE TABLE IF NOT EXISTS public.auth_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'ROLE', 'FIELD_RESTRICTION', 'CUSTOM'
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create auth_permissions table
CREATE TABLE IF NOT EXISTS public.auth_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    resource_type TEXT NOT NULL,
    scopes TEXT[] NOT NULL,
    policy_ids UUID[] NOT NULL,
    decision_strategy TEXT NOT NULL DEFAULT 'UNANIMOUS', -- 'UNANIMOUS' or 'AFFIRMATIVE'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.auth_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_permissions ENABLE ROW LEVEL SECURITY;

-- Dynamic policies/permissions tables should be readable by all authenticated users 
-- but only writable by administrators
CREATE POLICY "Allow read access to authenticated users on auth_policies"
    ON public.auth_policies FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow write access to admins on auth_policies"
    ON public.auth_policies FOR ALL
    TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Allow read access to authenticated users on auth_permissions"
    ON public.auth_permissions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow write access to admins on auth_permissions"
    ON public.auth_permissions FOR ALL
    TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Seed default policies
INSERT INTO public.auth_policies (id, name, description, type, configuration) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Only Admins', 'Restricts access to users with admin role only', 'ROLE', '{"roles": ["admin"]}'),
    ('10000000-0000-0000-0000-000000000002', 'Only Agents and Supervisors', 'Restricts access to agent, agent_supervisor, and admin roles', 'ROLE', '{"roles": ["admin", "agent", "agent_supervisor"]}'),
    ('10000000-0000-0000-0000-000000000003', 'Room Rates Field Restriction', 'Blocks non-admins from adding or modifying room rates', 'FIELD_RESTRICTION', '{"roles": ["admin"], "restricted_fields": ["room_rates"]}')
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    configuration = EXCLUDED.configuration;

-- Seed default permissions mapping resource scopes to policies
INSERT INTO public.auth_permissions (id, name, resource_type, scopes, policy_ids, decision_strategy) VALUES
    ('20000000-0000-0000-0000-000000000001', 'Hotel Save Permission', 'urn:nilathra:resource:hotel', ARRAY['scopes:hotel:create', 'scopes:hotel:update'], ARRAY['10000000-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000003'::uuid], 'UNANIMOUS'),
    ('20000000-0000-0000-0000-000000000002', 'Hotel Delete Permission', 'urn:nilathra:resource:hotel', ARRAY['scopes:hotel:delete'], ARRAY['10000000-0000-0000-0000-000000000001'::uuid], 'UNANIMOUS')
ON CONFLICT (name) DO UPDATE SET
    resource_type = EXCLUDED.resource_type,
    scopes = EXCLUDED.scopes,
    policy_ids = EXCLUDED.policy_ids,
    decision_strategy = EXCLUDED.decision_strategy;
