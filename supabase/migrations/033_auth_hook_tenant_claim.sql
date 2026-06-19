-- Migration 033: Custom access token hook — embed tenant_id in JWT
--
-- Problem: the middleware queries `usuarios` on every request to get tenant_id.
-- Solution: embed tenant_id as a JWT claim at login time via Supabase Auth Hook.
-- The middleware then reads it from the token — zero DB calls.
--
-- After applying this migration:
-- 1. Go to Supabase Dashboard → Authentication → Hooks
-- 2. Enable "Custom Access Token Hook"
-- 3. Set function to: public.custom_access_token_hook

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_id uuid;
    claims      jsonb;
BEGIN
    -- Fetch tenant_id for the user
    SELECT tenant_id INTO v_tenant_id
    FROM public.usuarios
    WHERE id = (event->>'user_id')::uuid;

    claims := event->'claims';

    -- Embed tenant_id as a custom claim (null if not yet assigned — onboarding)
    IF v_tenant_id IS NOT NULL THEN
        claims := jsonb_set(claims, '{tenant_id}', to_jsonb(v_tenant_id::text));
    ELSE
        claims := claims - 'tenant_id';
    END IF;

    event := jsonb_set(event, '{claims}', claims);

    RETURN event;
END;
$$;

-- Grant execute to supabase auth admin role (required for hooks)
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
