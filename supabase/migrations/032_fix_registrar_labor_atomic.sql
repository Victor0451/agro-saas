-- Migration 032: Make registrar_labor fully atomic
--
-- Problems fixed:
-- 1. moneda, tipo_cambio, costo_jornales were set via a separate UPDATE after the RPC,
--    making the operation non-atomic (partial failures left incomplete records).
-- 2. labores_personal inserts were done in the API route outside the transaction.
-- 3. Stock check referenced insumos.stock_actual which was dropped in migration 025.
--    Removed — insumos is now a catalog, not an inventory tracker.

CREATE OR REPLACE FUNCTION registrar_labor(
    p_tenant_id          uuid,
    p_finca_id           uuid,
    p_lote_id            uuid,
    p_fecha              date,
    p_tipo_labor         varchar,
    p_estado_fenologico  varchar,
    p_jornales           decimal,
    p_observaciones      text,
    p_insumos            jsonb,   -- [{ insumo_id, cantidad }]
    p_moneda             varchar  DEFAULT 'ARS',
    p_tipo_cambio        decimal  DEFAULT 1,
    p_costo_jornales     decimal  DEFAULT 0,
    p_personal           jsonb    DEFAULT '[]'  -- [{ personal_id, dias_trabajados }]
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
    -- 1. Insert labor header — all fields in one shot
    INSERT INTO labores (
        tenant_id, finca_id, lote_id, fecha,
        tipo_labor, estado_fenologico,
        jornales, costo_jornales,
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
            -- Validate insumo belongs to this tenant
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
