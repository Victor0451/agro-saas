-- Add fecha_compra to insumos
ALTER TABLE insumos
ADD COLUMN fecha_compra DATE DEFAULT CURRENT_DATE;
