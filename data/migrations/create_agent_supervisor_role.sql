-- 1. Insert Agent Supervisor role
INSERT INTO public.roles (name, description)
VALUES ('agent_supervisor', 'Agent Supervisor Role')
ON CONFLICT (name) DO NOTHING;

-- 2. Create agent_supervisor_profiles table
CREATE TABLE IF NOT EXISTS public.agent_supervisor_profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.agent_supervisor_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Admins can do everything
DROP POLICY IF EXISTS admin_all_asp ON public.agent_supervisor_profiles;
CREATE POLICY admin_all_asp ON public.agent_supervisor_profiles FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Supervisors can read and update their own profiles
DROP POLICY IF EXISTS supervisor_read_self ON public.agent_supervisor_profiles;
CREATE POLICY supervisor_read_self ON public.agent_supervisor_profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS supervisor_update_self ON public.agent_supervisor_profiles;
CREATE POLICY supervisor_update_self ON public.agent_supervisor_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Authenticated users (like admins and agents) can view active supervisors for dropdown lists
DROP POLICY IF EXISTS public_read_supervisors ON public.agent_supervisor_profiles;
CREATE POLICY public_read_supervisors ON public.agent_supervisor_profiles FOR SELECT TO authenticated USING (is_active = TRUE);

-- 5. Add supervisor_id to agent_profiles
ALTER TABLE public.agent_profiles ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES public.agent_supervisor_profiles(id) ON DELETE SET NULL;
