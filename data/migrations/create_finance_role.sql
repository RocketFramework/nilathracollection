-- 1. Insert Finance role
INSERT INTO public.roles (name, description)
VALUES ('finance', 'Finance Team Role')
ON CONFLICT (name) DO NOTHING;

-- 2. Create finance_profiles table
CREATE TABLE IF NOT EXISTS public.finance_profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.finance_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Admins can do everything
DROP POLICY IF EXISTS admin_all_fp ON public.finance_profiles;
CREATE POLICY admin_all_fp ON public.finance_profiles FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Finance users can read and update their own profiles
DROP POLICY IF EXISTS finance_read_self ON public.finance_profiles;
CREATE POLICY finance_read_self ON public.finance_profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS finance_update_self ON public.finance_profiles;
CREATE POLICY finance_update_self ON public.finance_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Authenticated users can view active finance profiles (needed for logs, reference, dropdowns)
DROP POLICY IF EXISTS public_read_finance ON public.finance_profiles;
CREATE POLICY public_read_finance ON public.finance_profiles FOR SELECT TO authenticated USING (is_active = TRUE);
