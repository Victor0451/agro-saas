-- Create compras_insumos: tenant-scoped purchase ledger for inputs

CREATE TABLE compras_insumos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    insumo_id uuid NOT NULL REFERENCES insumos(id) ON DELETE RESTRICT,
    fecha_compra date NOT NULL,
    cantidad numeric(10,3) NOT NULL CHECK (cantidad > 0),
    costo_unitario numeric(12,2) NOT NULL CHECK (costo_unitario > 0),
    moneda text NOT NULL DEFAULT 'ARS',
    tipo_cambio numeric(10,4) NOT NULL DEFAULT 1,
    notas text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_compras_insumos_tenant ON compras_insumos(tenant_id);
CREATE INDEX idx_compras_insumos_insumo ON compras_insumos(insumo_id);
CREATE INDEX idx_compras_insumos_fecha ON compras_insumos(tenant_id, fecha_compra DESC);

ALTER TABLE compras_insumos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for compras_insumos" ON compras_insumos
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());
