-- Migration 031: Add p_moneda_salida to get_deviation_report
--
-- Allows the report to be expressed in ARS or USD.
-- ARS mode (default): USD items converted to ARS via tipo_cambio_ref
-- USD mode: ARS items converted to USD by dividing by tipo_cambio_ref

CREATE OR REPLACE FUNCTION get_deviation_report(
    p_tenant_id         uuid,
    p_anio              integer,
    p_mes               integer  DEFAULT NULL,
    p_tipo_cambio_ref   numeric  DEFAULT 1,
    p_moneda_salida     text     DEFAULT 'ARS'   -- 'ARS' | 'USD'
)
RETURNS TABLE (
    categoria_id        uuid,
    categoria_nombre    text,
    monto_presupuestado numeric,
    gasto_real          numeric,
    desvio_monto        numeric,
    desvio_pct          numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    WITH base AS (
        SELECT
            c.id   AS categoria_id,
            c.nombre AS categoria_nombre,

            -- Budget in ARS (always intermediate)
            COALESCE(SUM(
                p.monto_presupuestado *
                CASE WHEN p.moneda = 'USD' THEN p_tipo_cambio_ref ELSE 1 END
            ), 0) AS presupuesto_ars,

            -- Actual spend in ARS (always intermediate)
            COALESCE(SUM(
                ci.cantidad * ci.costo_unitario *
                CASE WHEN ci.moneda = 'USD' THEN ci.tipo_cambio ELSE 1 END
            ), 0) AS gasto_ars

        FROM categorias_insumos c
        LEFT JOIN presupuestos_insumos p ON
            p.categoria_id = c.id AND
            p.tenant_id    = p_tenant_id AND
            p.insumo_id    IS NULL AND
            p.periodo_anio = p_anio AND
            (p_mes IS NULL AND p.periodo_mes IS NULL OR p.periodo_mes = p_mes)
        LEFT JOIN insumos i ON
            i.categoria_id = c.id AND
            i.tenant_id    = p_tenant_id
        LEFT JOIN compras_insumos ci ON
            ci.insumo_id  = i.id AND
            ci.tenant_id  = p_tenant_id AND
            EXTRACT(YEAR  FROM ci.fecha_compra)::integer = p_anio AND
            (p_mes IS NULL OR EXTRACT(MONTH FROM ci.fecha_compra)::integer = p_mes)
        GROUP BY c.id, c.nombre
        HAVING
            COALESCE(SUM(
                p.monto_presupuestado *
                CASE WHEN p.moneda = 'USD' THEN p_tipo_cambio_ref ELSE 1 END
            ), 0) > 0
            OR COALESCE(SUM(ci.cantidad * ci.costo_unitario), 0) > 0
    )
    SELECT
        categoria_id,
        categoria_nombre,

        -- Convert output to target currency
        CASE
            WHEN p_moneda_salida = 'USD' AND p_tipo_cambio_ref > 0
                THEN ROUND(presupuesto_ars / p_tipo_cambio_ref, 2)
            ELSE ROUND(presupuesto_ars, 2)
        END AS monto_presupuestado,

        CASE
            WHEN p_moneda_salida = 'USD' AND p_tipo_cambio_ref > 0
                THEN ROUND(gasto_ars / p_tipo_cambio_ref, 2)
            ELSE ROUND(gasto_ars, 2)
        END AS gasto_real,

        CASE
            WHEN p_moneda_salida = 'USD' AND p_tipo_cambio_ref > 0
                THEN ROUND((gasto_ars - presupuesto_ars) / p_tipo_cambio_ref, 2)
            ELSE ROUND(gasto_ars - presupuesto_ars, 2)
        END AS desvio_monto,

        CASE
            WHEN presupuesto_ars = 0 THEN NULL
            ELSE ROUND((gasto_ars - presupuesto_ars) / presupuesto_ars * 100, 2)
        END AS desvio_pct

    FROM base
    ORDER BY categoria_nombre;
$$;
