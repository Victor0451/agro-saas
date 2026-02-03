-- Seed default categories if they don't exist
INSERT INTO categorias_insumos (nombre, descripcion)
SELECT 'Semillas', 'Semillas de tabaco y otros cultivos'
WHERE NOT EXISTS (SELECT 1 FROM categorias_insumos WHERE nombre ILIKE 'Semilla%');

INSERT INTO categorias_insumos (nombre, descripcion)
SELECT 'Sustratos', 'Materiales para siembra (turbas, perlita, etc)'
WHERE NOT EXISTS (SELECT 1 FROM categorias_insumos WHERE nombre ILIKE 'Sustrato%');

INSERT INTO categorias_insumos (nombre, descripcion)
SELECT 'Fertilizantes', 'Productos para nutrición de suelos y plantas'
WHERE NOT EXISTS (SELECT 1 FROM categorias_insumos WHERE nombre ILIKE 'Fertilizante%');

INSERT INTO categorias_insumos (nombre, descripcion)
SELECT 'Agroquímicos', 'Productos fitosanitarios'
WHERE NOT EXISTS (SELECT 1 FROM categorias_insumos WHERE nombre ILIKE 'Agroquímicos%');
