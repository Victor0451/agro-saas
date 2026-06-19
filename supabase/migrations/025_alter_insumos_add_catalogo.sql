-- Alter insumos: add catalogo_id FK and drop purchase-specific columns
-- Purchase data moves to compras_insumos (see migration 026)

ALTER TABLE insumos
    ADD COLUMN IF NOT EXISTS catalogo_id uuid REFERENCES catalogo_insumos(id) ON DELETE SET NULL;

ALTER TABLE insumos
    DROP COLUMN IF EXISTS costo_unitario,
    DROP COLUMN IF EXISTS stock_actual,
    DROP COLUMN IF EXISTS fecha_compra,
    DROP COLUMN IF EXISTS moneda,
    DROP COLUMN IF EXISTS tipo_cambio;

-- Index for catalog lookups
CREATE INDEX IF NOT EXISTS idx_insumos_catalogo_id ON insumos(catalogo_id);

-- Composite index for tenant + category queries
CREATE INDEX IF NOT EXISTS idx_insumos_tenant_categoria ON insumos(tenant_id, categoria_id);
