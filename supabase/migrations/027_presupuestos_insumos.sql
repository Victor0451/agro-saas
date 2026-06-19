-- Create presupuestos_insumos: tenant-scoped budget entries for inputs
-- Supports both category-level (insumo_id IS NULL) and insumo-level budgets.
-- Supports both monthly (periodo_mes set) and yearly (periodo_mes IS NULL) periods.

CREATE TABLE presupuestos_insumos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    categoria_id uuid REFERENCES categorias_insumos(id) ON DELETE SET NULL,
    insumo_id uuid REFERENCES insumos(id) ON DELETE SET NULL,
    periodo_mes integer CHECK (periodo_mes BETWEEN 1 AND 12),
    periodo_anio integer NOT NULL,
    monto_presupuestado numeric(12,2) NOT NULL CHECK (monto_presupuestado > 0),
    moneda text NOT NULL DEFAULT 'ARS',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE NULLS NOT DISTINCT (tenant_id, categoria_id, insumo_id, periodo_mes, periodo_anio)
);

CREATE INDEX idx_presupuestos_insumos_tenant ON presupuestos_insumos(tenant_id);
CREATE INDEX idx_presupuestos_insumos_periodo ON presupuestos_insumos(tenant_id, periodo_anio, periodo_mes);

ALTER TABLE presupuestos_insumos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for presupuestos_insumos" ON presupuestos_insumos
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());
