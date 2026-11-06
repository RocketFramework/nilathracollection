-- =====================================================================
-- Multi-Layer Agent & Supervisor Hierarchy Migration
-- Roles (from junior to senior):
--   1. agent                (Agent)
--   2. senior_agent         (Senior Agent)
--   3. executive_agent      (Executive Agent)
--   4. agent_supervisor     (Supervisor)
--   5. senior_supervisor    (Senior Supervisor)
--   6. executive_supervisor (Executive Supervisor)
--   7. principal_supervisor (Principal Supervisor)
-- =====================================================================

-- 1. Seed all hierarchy roles into public.roles
INSERT INTO public.roles (name, description) VALUES
  ('agent', 'Travel Agent for handling requests and organizing itineraries'),
  ('senior_agent', 'Senior Agent Role'),
  ('executive_agent', 'Executive Agent Role'),
  ('agent_supervisor', 'Agent Supervisor Role'),
  ('senior_supervisor', 'Senior Supervisor Role'),
  ('executive_supervisor', 'Executive Supervisor Role'),
  ('principal_supervisor', 'Principal Supervisor Role')
ON CONFLICT (name) DO NOTHING;

-- 2. Allow agent_profiles.supervisor_id to reference any superior user in public.users(id)
--    (e.g., Senior Agent, Executive Agent, or any Supervisor tier) instead of only agent_supervisor_profiles(id)
ALTER TABLE public.agent_profiles
  DROP CONSTRAINT IF EXISTS agent_profiles_supervisor_id_fkey;

ALTER TABLE public.agent_profiles
  ADD COLUMN IF NOT EXISTS supervisor_id UUID;

ALTER TABLE public.agent_profiles
  ADD CONSTRAINT agent_profiles_supervisor_id_fkey
  FOREIGN KEY (supervisor_id) REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agent_profiles_supervisor_id
  ON public.agent_profiles(supervisor_id);

-- 3. Add supervisor_id to agent_supervisor_profiles so Supervisors can report to
--    Senior Supervisors, Executive Supervisors, or Principal Supervisors
ALTER TABLE public.agent_supervisor_profiles
  ADD COLUMN IF NOT EXISTS supervisor_id UUID;

ALTER TABLE public.agent_supervisor_profiles
  DROP CONSTRAINT IF EXISTS agent_supervisor_profiles_supervisor_id_fkey;

ALTER TABLE public.agent_supervisor_profiles
  ADD CONSTRAINT agent_supervisor_profiles_supervisor_id_fkey
  FOREIGN KEY (supervisor_id) REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agent_supervisor_profiles_supervisor_id
  ON public.agent_supervisor_profiles(supervisor_id);

