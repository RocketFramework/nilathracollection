-- Seed default permissions mapping for Email Templates resource to the "Only Admins" policy
INSERT INTO public.auth_permissions (id, name, resource_type, scopes, policy_ids, decision_strategy) VALUES
    ('20000000-0000-0000-0000-000000000003', 'Email Templates Permission', 'urn:nilathra:resource:email-templates', ARRAY['scopes:email-templates:view', 'scopes:email-templates:manage'], ARRAY['10000000-0000-0000-0000-000000000001'::uuid], 'UNANIMOUS')
ON CONFLICT (name) DO UPDATE SET
    resource_type = EXCLUDED.resource_type,
    scopes = EXCLUDED.scopes,
    policy_ids = EXCLUDED.policy_ids,
    decision_strategy = EXCLUDED.decision_strategy;
