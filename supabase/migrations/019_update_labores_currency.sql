-- Add currency support to labors
ALTER TABLE labores 
ADD COLUMN IF NOT EXISTS moneda VARCHAR(3) DEFAULT 'ARS',
ADD COLUMN IF NOT EXISTS tipo_cambio DECIMAL(10,2) DEFAULT 1.00;

-- Optional: Update existing rows if any
UPDATE labores SET moneda = 'ARS', tipo_cambio = 1 WHERE moneda IS NULL;
