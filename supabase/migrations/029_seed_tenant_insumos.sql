-- Migration 029: Seed tenant insumos from global catalog
--
-- Design decision (2026-04-04):
-- The `insumos` table is the tenant's own editable catalog, pre-seeded from
-- `catalogo_insumos` (global template) on tenant creation. This gives each
-- tenant full ownership over their catalog while keeping a traceable reference
-- to the source via `catalogo_id`. Compras and presupuestos reference `insumos`
-- (tenant) — not the global catalog directly — which supports customization
-- without losing domain integrity.

-- -------------------------------------------------------------------------
-- 1. Function: seed_tenant_insumos
--    Copies all active global catalog items into the tenant's insumos table.
--    Idempotent: skips items already present (matched by catalogo_id + tenant).
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION seed_tenant_insumos(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

-- -------------------------------------------------------------------------
-- 2. Update create_owner_tenant to call seed_tenant_insumos after creation
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_owner_tenant(
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

-- -------------------------------------------------------------------------
-- 3. Backfill: seed existing tenants that have no insumos yet
-- -------------------------------------------------------------------------
DO $$
DECLARE
    t_id uuid;
BEGIN
    FOR t_id IN
        SELECT id FROM tenants
        WHERE NOT EXISTS (
            SELECT 1 FROM insumos WHERE tenant_id = tenants.id
        )
    LOOP
        PERFORM seed_tenant_insumos(t_id);
    END LOOP;
END;
$$;
