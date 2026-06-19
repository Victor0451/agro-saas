-- Migration 030: Update get_deviation_report to support multicurrency budgets
--
-- Problem: presupuestos_insumos.monto_presupuestado can be in ARS or USD.
-- The previous RPC summed it as-is, mixing currencies and producing wrong desvío.
--
-- Solution: accept p_tipo_cambio_ref (reference exchange rate for the period).
-- USD budgets are converted to ARS using this rate.
-- USD purchases were already converted at purchase time via their stored tipo_cambio.
-- All output is in ARS.

CREATE OR REPLACE FUNCTION get_deviation_report(
    p_tenant_id       uuid,
    p_anio            integer,
    p_mes             integer  DEFAULT NULL,
    p_tipo_cambio_ref numeric  DEFAULT 1
)
RETURNS TABLE (
    categoria_id       uuid,
    categoria_nombre   text,
    monto_presupuestado numeric,  -- always ARS
    gasto_real          numeric,  -- always ARS
    desvio_monto        numeric,
    desvio_pct          numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT
        c.id AS categoria_id,
        c.nombre AS categoria_nombre,

        -- Budget: convert USD → ARS using reference rate
        COALESCE(SUM(
            p.monto_presupuestado *
            CASE WHEN p.moneda = 'USD' THEN p_tipo_cambio_ref ELSE 1 END
        ), 0) AS monto_presupuestado,

        -- Actual spend: convert USD → ARS using stored rate at purchase time
        COALESCE(SUM(
            ci.cantidad * ci.costo_unitario *
            CASE WHEN ci.moneda = 'USD' THEN ci.tipo_cambio ELSE 1 END
        ), 0) AS gasto_real,

        -- Deviation amount (ARS)
        COALESCE(SUM(
            ci.cantidad * ci.costo_unitario *
            CASE WHEN ci.moneda = 'USD' THEN ci.tipo_cambio ELSE 1 END
        ), 0) - COALESCE(SUM(
            p.monto_presupuestado *
            CASE WHEN p.moneda = 'USD' THEN p_tipo_cambio_ref ELSE 1 END
        ), 0) AS desvio_monto,

        -- Deviation percentage
        CASE
            WHEN COALESCE(SUM(
                p.monto_presupuestado *
                CASE WHEN p.moneda = 'USD' THEN p_tipo_cambio_ref ELSE 1 END
            ), 0) = 0 THEN NULL
            ELSE ROUND(
                (
                    COALESCE(SUM(
                        ci.cantidad * ci.costo_unitario *
                        CASE WHEN ci.moneda = 'USD' THEN ci.tipo_cambio ELSE 1 END
                    ), 0) - COALESCE(SUM(
                        p.monto_presupuestado *
                        CASE WHEN p.moneda = 'USD' THEN p_tipo_cambio_ref ELSE 1 END
                    ), 0)
                ) / NULLIF(SUM(
                    p.monto_presupuestado *
                    CASE WHEN p.moneda = 'USD' THEN p_tipo_cambio_ref ELSE 1 END
                ), 0) * 100, 2
            )
        END AS desvio_pct

    FROM categorias_insumos c
    LEFT JOIN presupuestos_insumos p ON
        p.categoria_id   = c.id AND
        p.tenant_id      = p_tenant_id AND
        p.insumo_id      IS NULL AND
        p.periodo_anio   = p_anio AND
        (p_mes IS NULL AND p.periodo_mes IS NULL OR p.periodo_mes = p_mes)
    LEFT JOIN insumos i ON
        i.categoria_id = c.id AND
        i.tenant_id    = p_tenant_id
    LEFT JOIN compras_insumos ci ON
        ci.insumo_id   = i.id AND
        ci.tenant_id   = p_tenant_id AND
        EXTRACT(YEAR  FROM ci.fecha_compra)::integer = p_anio AND
        (p_mes IS NULL OR EXTRACT(MONTH FROM ci.fecha_compra)::integer = p_mes)
    GROUP BY c.id, c.nombre
    HAVING
        COALESCE(SUM(
            p.monto_presupuestado *
            CASE WHEN p.moneda = 'USD' THEN p_tipo_cambio_ref ELSE 1 END
        ), 0) > 0
        OR COALESCE(SUM(ci.cantidad * ci.costo_unitario), 0) > 0
    ORDER BY c.nombre;
$$;
