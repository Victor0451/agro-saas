-- Migration 035: security-hardening
--
-- Multi-tenant RPC guards: adds reusable tenant-validation helpers and applies
-- them to all SECURITY DEFINER RPCs that accept p_tenant_id.
--
-- Order: helpers first, then patches (helpers must exist before callers reference them).

-- =============================================================================
-- SECTION 1: Helper functions (Task 1)
-- =============================================================================

-- public.assert_caller_tenant(p_expected_tenant uuid) RETURNS void
-- SECURITY DEFINER, STABLE, SET search_path = public, auth
-- Reads tenant_id from JWT claim first (fast path), falls back to public.usuarios.
-- Raises 42501 tenant_mismatch if caller belongs to a different tenant or has none.
CREATE OR REPLACE FUNCTION public.assert_caller_tenant(p_expected_tenant uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
DECLARE
  v_jwt_claim uuid;
  v_db_tenant uuid;
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'tenant_mismatch: no authenticated user'
      USING ERRCODE = '42501';
  END IF;

  BEGIN
    v_jwt_claim := (auth.jwt() ->> 'tenant_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_jwt_claim := NULL;
  END;

  IF v_jwt_claim IS NULL THEN
    SELECT tenant_id INTO v_db_tenant
    FROM public.usuarios
    WHERE id = v_caller;
  END IF;

  IF COALESCE(v_jwt_claim, v_db_tenant) IS DISTINCT FROM p_expected_tenant THEN
    RAISE EXCEPTION 'tenant_mismatch: caller % does not belong to tenant %',
      v_caller, p_expected_tenant
      USING ERRCODE = '42501';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assert_caller_tenant(uuid) TO authenticated;

-- public.assert_caller_has_no_tenant() RETURNS void
-- SECURITY DEFINER, STABLE, SET search_path = public, auth
-- Raises 42501 already_has_tenant if auth.uid() already has a tenant_id set.
CREATE OR REPLACE FUNCTION public.assert_caller_has_no_tenant()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_tenant uuid;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'already_has_tenant: no authenticated user'
      USING ERRCODE = '42501';
  END IF;
  SELECT tenant_id INTO v_tenant FROM public.usuarios WHERE id = v_caller;
  IF v_tenant IS NOT NULL THEN
    RAISE EXCEPTION 'already_has_tenant: caller % already belongs to tenant %',
      v_caller, v_tenant
      USING ERRCODE = '42501';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assert_caller_has_no_tenant() TO authenticated;