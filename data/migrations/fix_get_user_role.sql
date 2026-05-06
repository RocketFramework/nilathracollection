-- Fix for get_user_role function to check profile tables AND auth.users metadata
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    user_role VARCHAR(50);
    meta_role VARCHAR(50);
BEGIN
    -- First check user_roles table
    SELECT r.name INTO user_role
    FROM public.roles r
    JOIN public.user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = $1
    LIMIT 1;

    -- If found, return
    IF user_role IS NOT NULL THEN
        RETURN user_role;
    END IF;

    -- If not found, check admin_profiles
    IF EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = $1) THEN
        RETURN 'admin';
    END IF;

    -- If not found, check agent_profiles
    IF EXISTS (SELECT 1 FROM public.agent_profiles WHERE id = $1) THEN
        RETURN 'agent';
    END IF;

    -- If not found, check tourist_profiles
    IF EXISTS (SELECT 1 FROM public.tourist_profiles WHERE id = $1) THEN
        RETURN 'tourist';
    END IF;

    -- Finally check auth metadata as a fallback (requires security definer context)
    SELECT (raw_user_meta_data->>'role')::VARCHAR(50) INTO meta_role
    FROM auth.users 
    WHERE id = $1;

    IF meta_role IS NOT NULL THEN
        RETURN meta_role;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
