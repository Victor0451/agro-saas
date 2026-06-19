-- Migration 034: Add stock_minimo to insumos
--
-- Each tenant insumo now has a configurable minimum stock alert threshold.
-- Default is calculated from the unit — sensible agricultural defaults.

ALTER TABLE insumos
    ADD COLUMN IF NOT EXISTS stock_minimo numeric NOT NULL DEFAULT 1;

-- Backfill existing rows with smart defaults per unit
UPDATE insumos SET stock_minimo = CASE
    WHEN unidad IN ('litros', 'l')      THEN 10
    WHEN unidad IN ('kg')               THEN 5
    WHEN unidad IN ('tn')               THEN 1
    WHEN unidad IN ('m3')               THEN 2
    WHEN unidad IN ('m2')               THEN 20
    WHEN unidad IN ('kWh')              THEN 50
    WHEN unidad IN ('u', 'unidades')    THEN 5
    ELSE 1
END;

-- Index to support dashboard low-stock queries efficiently
CREATE INDEX IF NOT EXISTS idx_insumos_stock_minimo ON insumos(tenant_id, stock_minimo);
