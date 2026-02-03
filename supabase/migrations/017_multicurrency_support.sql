-- Add currency support columns to relevant tables
-- Columns: 
-- moneda: ISO 4217 code (ARS, USD, EUR). Default 'ARS'.
-- tipo_cambio: Exchange rate at the time of transaction (relative to ARS usually, or base currency). Default 1.00.

-- 1. Insumos
ALTER TABLE insumos 
ADD COLUMN moneda VARCHAR(3) DEFAULT 'ARS',
ADD COLUMN tipo_cambio DECIMAL(10, 2) DEFAULT 1.00;

-- 2. Plantaciones (Costos)
ALTER TABLE plantaciones
ADD COLUMN moneda VARCHAR(3) DEFAULT 'ARS',
ADD COLUMN tipo_cambio DECIMAL(10, 2) DEFAULT 1.00;

-- 3. Fertilizaciones
ALTER TABLE fertilizaciones
ADD COLUMN moneda VARCHAR(3) DEFAULT 'ARS',
ADD COLUMN tipo_cambio DECIMAL(10, 2) DEFAULT 1.00;

-- 4. Cultivos (Labores)
ALTER TABLE cultivos
ADD COLUMN moneda VARCHAR(3) DEFAULT 'ARS',
ADD COLUMN tipo_cambio DECIMAL(10, 2) DEFAULT 1.00;

-- 5. Cosechas
ALTER TABLE cosechas
ADD COLUMN moneda VARCHAR(3) DEFAULT 'ARS',
ADD COLUMN tipo_cambio DECIMAL(10, 2) DEFAULT 1.00;

-- 6. Curados (Costos de carga/descarga)
ALTER TABLE curados
ADD COLUMN moneda VARCHAR(3) DEFAULT 'ARS',
ADD COLUMN tipo_cambio DECIMAL(10, 2) DEFAULT 1.00;

-- 7. Registros de Mano de Obra (Jornales)
ALTER TABLE registros_mano_obra
ADD COLUMN moneda VARCHAR(3) DEFAULT 'ARS',
ADD COLUMN tipo_cambio DECIMAL(10, 2) DEFAULT 1.00;
