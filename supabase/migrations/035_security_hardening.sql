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

-- =============================================================================
-- SECTION 2: Patch SECURITY DEFINER RPCs with tenant guard (Task 2)
-- =============================================================================

-- Patched: added PERFORM public.assert_caller_tenant(p_tenant_id) as first
-- executable statement. Body otherwise identical to migration 032.
CREATE OR REPLACE FUNCTION public.registrar_labor(
    p_tenant_id          uuid,
    p_finca_id           uuid,
    p_lote_id            uuid,
    p_fecha              date,
    p_tipo_labor         varchar,
    p_estado_fenologico  varchar,
    p_jornales           decimal,
    p_observaciones      text,
    p_insumos            jsonb,
    p_moneda             varchar  DEFAULT 'ARS',
    p_tipo_cambio        decimal  DEFAULT 1,
    p_costo_jornales     decimal  DEFAULT 0,
    p_personal           jsonb    DEFAULT '[]'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_labor_id   uuid;
    v_insumo     jsonb;
    v_personal   jsonb;
BEGIN
    -- Tenant guard (raises 42501 on mismatch)
    PERFORM public.assert_caller_tenant(p_tenant_id);

    -- 1. Insert labor header
    INSERT INTO labores (
        tenant_id, finca_id, lote_id, fecha,
        tipo_labor, estado_fenologico,
        Jornales, costo_jornales,
        moneda, tipo_cambio,
        observaciones
    ) VALUES (
        p_tenant_id, p_finca_id, p_lote_id, p_fecha,
        p_tipo_labor, p_estado_fenologico,
        p_jornales, p_costo_jornales,
        p_moneda, p_tipo_cambio,
        p_observaciones
    )
    RETURNING id INTO v_labor_id;

    -- 2. Insert insumo usage detail
    IF p_insumos IS NOT NULL AND jsonb_array_length(p_insumos) > 0 THEN
        FOR v_insumo IN SELECT * FROM jsonb_array_elements(p_insumos)
        LOOP
            IF NOT EXISTS (
                SELECT 1 FROM insumos
                WHERE id        = (v_insumo->>'insumo_id')::uuid
                  AND tenant_id = p_tenant_id
            ) THEN
                RAISE EXCEPTION 'Insumo % no encontrado o no pertenece al tenant', v_insumo->>'insumo_id';
            END IF;

            INSERT INTO labores_insumos (labor_id, insumo_id, cantidad)
            VALUES (
                v_labor_id,
                (v_insumo->>'insumo_id')::uuid,
                (v_insumo->>'cantidad')::decimal
            );
        END LOOP;
    END IF;

    -- 3. Insert personal assignments
    IF p_personal IS NOT NULL AND jsonb_array_length(p_personal) > 0 THEN
        FOR v_personal IN SELECT * FROM jsonb_array_elements(p_personal)
        LOOP
            INSERT INTO labores_personal (labor_id, personal_id, dias_trabajados, costo_asignado)
            VALUES (
                v_labor_id,
                (v_personal->>'personal_id')::uuid,
                (v_personal->>'dias_trabajados')::decimal,
                0
            );
        END LOOP;
    END IF;

    RETURN jsonb_build_object('id', v_labor_id, 'success', true);
END;
$$;

-- Patched: added PERFORM public.assert_caller_tenant(p_tenant_id) as first
-- executable statement. Body otherwise identical to migration 029.
CREATE OR REPLACE FUNCTION public.seed_tenant_insumos(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Tenant guard (raises 42501 on mismatch)
    PERFORM public.assert_caller_tenant(p_tenant_id);

    INSERT INTO insumos (tenant_id, catalogo_id, nombre, unidad, categoria_id, activo)
    SELECT
        p_tenant_id,
        c.id,
        c.nombre,
        c.unidad_default,
        c.categoria_id,
        true
    FROM catalogo_insumos c
    WHERE c.activo = true
      AND NOT EXISTS (
          SELECT 1
          FROM insumos i
          WHERE i.tenant_id = p_tenant_id
            AND i.catalogo_id = c.id
      );
END;
$$;

-- Patched: added PERFORM public.assert_caller_tenant(p_tenant_id) as first
-- executable statement. Body otherwise identical to migration 028.
-- Note: get_deviation_report is SQL language, STABLE, SECURITY DEFINER.
-- We must add the tenant guard as the first statement, but SQL functions
-- don't support PERFORM. Use a wrapper approach: keep the SQL body as-is
-- for the query, and add the guard as a separate statement within the
-- same function. Since SQL functions execute as a single expression,
-- we use a plpgsql wrapper to host the guard.
CREATE OR REPLACE FUNCTION public.get_deviation_report(
    p_tenant_id uuid,
    p_anio integer,
    p_mes integer DEFAULT NULL
)
RETURNS TABLE (
    categoria_id uuid,
    categoria_nombre text,
    monto_presupuestado numeric,
    gasto_real numeric,
    desvio_monto numeric,
    desvio_pct numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Tenant guard (raises 42501 on mismatch)
    PERFORM public.assert_caller_tenant(p_tenant_id);

    RETURN QUERY
    SELECT
        c.id AS categoria_id,
        c.nombre AS categoria_nombre,
        COALESCE(SUM(p.monto_presupuestado), 0) AS monto_presupuestado,
        COALESCE(SUM(
            ci.cantidad * ci.costo_unitario *
            CASE WHEN ci.moneda = 'USD' THEN ci.tipo_cambio ELSE 1 END
        ), 0) AS gasto_real,
        COALESCE(SUM(
            ci.cantidad * ci.costo_unitario *
            CASE WHEN ci.moneda = 'USD' THEN ci.tipo_cambio ELSE 1 END
        ), 0) - COALESCE(SUM(p.monto_presupuestado), 0) AS desvio_monto,
        CASE
            WHEN COALESCE(SUM(p.monto_presupuestado), 0) = 0 THEN NULL
            ELSE ROUND(
                (
                    COALESCE(SUM(
                        ci.cantidad * ci.costo_unitario *
                        CASE WHEN ci.moneda = 'USD' THEN ci.tipo_cambio ELSE 1 END
                    ), 0) - COALESCE(SUM(p.monto_presupuestado), 0)
                ) / SUM(p.monto_presupuestado) * 100, 2
            )
        END AS desvio_pct
    FROM categorias_insumos c
    LEFT JOIN presupuestos_insumos p ON
        p.categoria_id = c.id AND
        p.tenant_id = p_tenant_id AND
        p.insumo_id IS NULL AND
        p.periodo_anio = p_anio AND
        (p_mes IS NULL AND p.periodo_mes IS NULL OR p.periodo_mes = p_mes)
    LEFT JOIN insumos i ON
        i.categoria_id = c.id AND
        i.tenant_id = p_tenant_id
    LEFT JOIN compras_insumos ci ON
        ci.insumo_id = i.id AND
        ci.tenant_id = p_tenant_id AND
        EXTRACT(YEAR FROM ci.fecha_compra)::integer = p_anio AND
        (p_mes IS NULL OR EXTRACT(MONTH FROM ci.fecha_compra)::integer = p_mes)
    GROUP BY c.id, c.nombre
    HAVING COALESCE(SUM(p.monto_presupuestado), 0) > 0
        OR COALESCE(SUM(ci.cantidad * ci.costo_unitario), 0) > 0
    ORDER BY c.nombre;
END;
$$;
-- SECTION 3: Patch create_owner_tenant with strict guard (Task 3)
-- =============================================================================

-- Patched: added PERFORM public.assert_caller_has_no_tenant() as first
-- executable statement. Body otherwise identical to migration 029.
CREATE OR REPLACE FUNCTION public.create_owner_tenant(
    tenant_name text,
    finca_name  text,
    superficie  numeric DEFAULT 0,
    rendimiento numeric DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_tenant_id uuid;
    new_user_id   uuid;
    slug_base     text;
    final_slug    text;
BEGIN
    -- Tenant guard: reject users who already have a tenant (raises 42501)
    PERFORM public.assert_caller_has_no_tenant();

    -- 1. Generate slug
    slug_base  := lower(regexp_replace(tenant_name, '[^a-zA-Z0-9]', '-', 'g'));
    final_slug := slug_base || '-' || floor(random() * 1000)::text;

    -- 2. Create tenant
    INSERT INTO tenants (nombre, slug, activo)
    VALUES (tenant_name, final_slug, true)
    RETURNING id INTO new_tenant_id;

    -- 3. Get current user
    new_user_id := auth.uid();

    -- 4. Assign user to tenant as admin
    UPDATE usuarios
    SET tenant_id = new_tenant_id,
        rol       = 'admin'
    WHERE id = new_user_id;

    -- 5. Create first farm
    INSERT INTO fincas (nombre, tenant_id, superficie_total, rendimiento_esperado)
    VALUES (finca_name, new_tenant_id, superficie, rendimiento);

    -- 6. Seed tenant catalog from global template
    PERFORM seed_tenant_insumos(new_tenant_id);

    RETURN json_build_object(
        'tenant_id', new_tenant_id,
        'message',   'Tenant, farm and catalog seeded successfully'
    );
END;
$$;

-- =============================================================================
