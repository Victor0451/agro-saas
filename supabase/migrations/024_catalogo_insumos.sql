-- Create catalogo_insumos: global read-only shared catalog of inputs
-- No tenant isolation needed — all authenticated users can read it.

CREATE TABLE catalogo_insumos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    unidad_default text NOT NULL DEFAULT 'unidad',
    categoria_id uuid REFERENCES categorias_insumos(id) ON DELETE SET NULL,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE catalogo_insumos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalogo_insumos_read" ON catalogo_insumos
    FOR SELECT TO authenticated USING (true);

-- Seed: Combustibles
INSERT INTO catalogo_insumos (nombre, unidad_default, categoria_id) VALUES
    ('Gas Oil',  'litros', (SELECT id FROM categorias_insumos WHERE nombre = 'Combustibles')),
    ('Aceite 1', 'litros', (SELECT id FROM categorias_insumos WHERE nombre = 'Combustibles')),
    ('Aceite 2', 'litros', (SELECT id FROM categorias_insumos WHERE nombre = 'Combustibles'));

-- Seed: Almácigos
INSERT INTO catalogo_insumos (nombre, unidad_default, categoria_id) VALUES
    ('Bandejas',               'unidades', (SELECT id FROM categorias_insumos WHERE nombre = 'Almácigos')),
    ('Semilla',                'kg',       (SELECT id FROM categorias_insumos WHERE nombre = 'Almácigos')),
    ('Sustrato',               'm3',       (SELECT id FROM categorias_insumos WHERE nombre = 'Almácigos')),
    ('Vapam',                  'litros',   (SELECT id FROM categorias_insumos WHERE nombre = 'Almácigos')),
    ('Tierra de Monte',        'm3',       (SELECT id FROM categorias_insumos WHERE nombre = 'Almácigos')),
    ('Fertilizante almacigos', 'kg',       (SELECT id FROM categorias_insumos WHERE nombre = 'Almácigos')),
    ('Manta termica',          'm2',       (SELECT id FROM categorias_insumos WHERE nombre = 'Almácigos')),
    ('Plastico almacigos',     'm2',       (SELECT id FROM categorias_insumos WHERE nombre = 'Almácigos'));

-- Seed: Insecticidas
INSERT INTO catalogo_insumos (nombre, unidad_default, categoria_id) VALUES
    ('Imidacloprid',  'litros', (SELECT id FROM categorias_insumos WHERE nombre = 'Insecticidas')),
    ('Tiometoxan',    'kg',     (SELECT id FROM categorias_insumos WHERE nombre = 'Insecticidas')),
    ('Abamectina',    'litros', (SELECT id FROM categorias_insumos WHERE nombre = 'Insecticidas')),
    ('Dimetoato',     'litros', (SELECT id FROM categorias_insumos WHERE nombre = 'Insecticidas')),
    ('Insecticida 1', 'litros', (SELECT id FROM categorias_insumos WHERE nombre = 'Insecticidas')),
    ('Insecticida 2', 'litros', (SELECT id FROM categorias_insumos WHERE nombre = 'Insecticidas')),
    ('Insecticida 3', 'litros', (SELECT id FROM categorias_insumos WHERE nombre = 'Insecticidas'));

-- Seed: Herbicidas
INSERT INTO catalogo_insumos (nombre, unidad_default, categoria_id) VALUES
    ('Metoalaclor', 'litros', (SELECT id FROM categorias_insumos WHERE nombre = 'Herbicidas')),
    ('Clomazone',   'litros', (SELECT id FROM categorias_insumos WHERE nombre = 'Herbicidas')),
    ('Glifosato',   'litros', (SELECT id FROM categorias_insumos WHERE nombre = 'Herbicidas')),
    ('Herbicida 1', 'litros', (SELECT id FROM categorias_insumos WHERE nombre = 'Herbicidas'));

-- Seed: Fertilizantes
INSERT INTO catalogo_insumos (nombre, unidad_default, categoria_id) VALUES
    ('Foliar 1',              'litros', (SELECT id FROM categorias_insumos WHERE nombre = 'Fertilizantes')),
    ('Foliar 2',              'litros', (SELECT id FROM categorias_insumos WHERE nombre = 'Fertilizantes')),
    ('Fertilizante mezcla 1', 'kg',     (SELECT id FROM categorias_insumos WHERE nombre = 'Fertilizantes')),
    ('Fertilizante mezcla 2', 'kg',     (SELECT id FROM categorias_insumos WHERE nombre = 'Fertilizantes')),
    ('Nitrato de Potasio',    'kg',     (SELECT id FROM categorias_insumos WHERE nombre = 'Fertilizantes')),
    ('Sulfato de Potasio',    'kg',     (SELECT id FROM categorias_insumos WHERE nombre = 'Fertilizantes')),
    ('Enraizante',            'litros', (SELECT id FROM categorias_insumos WHERE nombre = 'Fertilizantes')),
    ('Fertilizante 1',        'kg',     (SELECT id FROM categorias_insumos WHERE nombre = 'Fertilizantes')),
    ('Fertilizante 2',        'kg',     (SELECT id FROM categorias_insumos WHERE nombre = 'Fertilizantes'));

-- Seed: Funguicidas
INSERT INTO catalogo_insumos (nombre, unidad_default, categoria_id) VALUES
    ('Fosetil aluminio', 'kg',     (SELECT id FROM categorias_insumos WHERE nombre = 'Funguicidas')),
    ('Mancozeb',         'kg',     (SELECT id FROM categorias_insumos WHERE nombre = 'Funguicidas')),
    ('Azoxistrobina',    'litros', (SELECT id FROM categorias_insumos WHERE nombre = 'Funguicidas')),
    ('Funguicida 1',     'litros', (SELECT id FROM categorias_insumos WHERE nombre = 'Funguicidas'));

-- Seed: Otros
INSERT INTO catalogo_insumos (nombre, unidad_default, categoria_id) VALUES
    ('Alcohol graso',     'litros',  (SELECT id FROM categorias_insumos WHERE nombre = 'Otros')),
    ('Desbrotador',       'litros',  (SELECT id FROM categorias_insumos WHERE nombre = 'Otros')),
    ('Hidracida maleica', 'litros',  (SELECT id FROM categorias_insumos WHERE nombre = 'Otros')),
    ('Hilo de enfardar',  'kg',      (SELECT id FROM categorias_insumos WHERE nombre = 'Otros')),
    ('Gas',               'unidades',(SELECT id FROM categorias_insumos WHERE nombre = 'Otros')),
    ('Energia',           'kWh',     (SELECT id FROM categorias_insumos WHERE nombre = 'Otros')),
    ('Otro 3',            'unidades',(SELECT id FROM categorias_insumos WHERE nombre = 'Otros')),
    ('Otro 4',            'unidades',(SELECT id FROM categorias_insumos WHERE nombre = 'Otros'));
