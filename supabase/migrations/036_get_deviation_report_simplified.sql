-- Migration 036: Simplify get_deviation_report
--
-- The version of get_deviation_report in migration 035 (applied as part of
-- security-hardening) accepted 5 parameters including p_tipo_cambio_ref and
-- p_moneda_salida for a final ARS↔USD conversion stage. In practice that stage
-- is not used — the gasto_real column is already in ARS via each compra's
-- own tipo_cambio.
--
-- This migration replaces the function with a simpler version that:
--   1. Still calls assert_caller_tenant(p_tenant_id) — security guard preserved.
--   2. Accepts the same 5 parameters (signature unchanged so callers in
--      src/app/api/insumos/informe/route.ts are unaffected).
--   3. Ignores p_tipo_cambio_ref and p_moneda_salida (kept in signature for
--      forward compatibility but not applied).
--   4. Returns gasto_real and desvio_monto always in ARS.
--   5. Adds desvio_pct as a percentage (NULL when monto_presupuestado is 0).
--
-- The full set of returned columns:
--   categoria_id, categoria_nombre, monto_presupuestado,
--   gasto_real, desvio_monto, desvio_pct

CREATE OR REPLACE FUNCTION public.get_deviation_report(
    p_tenant_id       uuid,
    p_anio            integer,
    p_mes             integer  DEFAULT NULL,
    p_tipo_cambio_ref numeric  DEFAULT 1,
    p_moneda_salida   text     DEFAULT 'ARS'
)
RETURNS TABLE (
    categoria_id        uuid,
    categoria_nombre    text,
    monto_presupuestado numeric,
    gasto_real          numeric,
    desvio_monto        numeric,
    desvio_pct          numeric
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