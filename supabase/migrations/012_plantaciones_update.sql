-- Add new columns to plantaciones table
ALTER TABLE plantaciones
ADD COLUMN finca_id UUID REFERENCES fincas(id) ON DELETE CASCADE,
ADD COLUMN almacigo_id UUID REFERENCES almacigos(id) ON DELETE SET NULL,
ADD COLUMN cantidad_plantas INTEGER DEFAULT 0,
ADD COLUMN superficie_cubierta DECIMAL(10,2) DEFAULT 0;

-- Indexes for performance
CREATE INDEX idx_plantaciones_finca ON plantaciones(finca_id);
CREATE INDEX idx_plantaciones_lote ON plantaciones(lote_id);
CREATE INDEX idx_plantaciones_almacigo ON plantaciones(almacigo_id);

-- Optional: RPC to transactional insert if we were doing complex stock deduction here too
-- For now, simple insert is fine, user manually updates stock or we add later.
-- But logically, planting MIGHT reduce 'stock' of seedlings if we tracked them as specific inventory.
-- Almacigos tracks 'production', not 'inventory' strictly, but we can assume logic later.
