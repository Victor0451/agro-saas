-- Create get_deviation_report RPC: aggregates budgeted vs actual spend per category
-- Supports monthly (p_mes not null) and yearly (p_mes = null) reports.
-- USD purchases are converted to ARS using the stored tipo_cambio at time of purchase.

CREATE OR REPLACE FUNCTION get_deviation_report(
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
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
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
$$;
