-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Core Tenant Tables
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  configuracion JSONB DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  rol VARCHAR(50) DEFAULT 'operador', -- admin, operador, visor
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usuarios_tenant ON usuarios(tenant_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- 2. Farm Configuration
CREATE TABLE fincas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  superficie_total DECIMAL(10,2),
  rendimiento_esperado DECIMAL(10,2),
  produccion_total DECIMAL(10,2),
  b1f_2025 DECIMAL(10,2),
  configuracion JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE lotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  finca_id UUID REFERENCES fincas(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  superficie DECIMAL(10,2),
  variedad VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lotes_tenant ON lotes(tenant_id);
CREATE INDEX idx_lotes_finca ON lotes(finca_id);

-- 3. Inputs (Insumos)
CREATE TABLE categorias_insumos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT
);

CREATE TABLE insumos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias_insumos(id),
  nombre VARCHAR(255) NOT NULL,
  unidad VARCHAR(50),
  costo_unitario DECIMAL(10,2),
  stock_actual DECIMAL(10,2) DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_insumos_tenant ON insumos(tenant_id);

-- 4. Production Cycle
CREATE TABLE almacigos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  variedad VARCHAR(100),
  cantidad_bandejas INTEGER,
  semilla_usada DECIMAL(10,2),
  sustrato_usado DECIMAL(10,2),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE plantaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  lote_id UUID REFERENCES lotes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  variedad VARCHAR(100),
  tipo_plantacion VARCHAR(50), 
  jornales_usados DECIMAL(10,2),
  costo_total DECIMAL(10,2),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE fertilizaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  lote_id UUID REFERENCES lotes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  tipo VARCHAR(100),
  cantidad DECIMAL(10,2),
  unidad VARCHAR(50),
  costo_unitario DECIMAL(10,2),
  costo_total DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE cultivos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  lote_id UUID REFERENCES lotes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  tipo_actividad VARCHAR(100),
  tractor VARCHAR(100),
  implemento VARCHAR(100),
  unidad VARCHAR(50),
  costo_unitario DECIMAL(10,2),
  costo_total DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE cosechas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  lote_id UUID REFERENCES lotes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  numero_corte INTEGER,
  cantidad DECIMAL(10,2),
  unidad VARCHAR(50),
  costo_unitario DECIMAL(10,2),
  costo_total DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Post-Harvest
CREATE TABLE estufas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  capacidad DECIMAL(10,2),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE curados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  estufa_id UUID REFERENCES estufas(id) ON DELETE CASCADE,
  lote_id UUID REFERENCES lotes(id),
  numero_carga INTEGER,
  fecha_inicio DATE NOT NULL,
  fecha_final DATE,
  variedad VARCHAR(100),
  corte INTEGER,
  peso_verde DECIMAL(10,2),
  peso_seco DECIMAL(10,2),
  costo_carga DECIMAL(10,2),
  costo_descarga DECIMAL(10,2),
  estado VARCHAR(50) DEFAULT 'en_proceso',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE clasificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  lote_id UUID REFERENCES lotes(id),
  fecha DATE NOT NULL,
  variedad VARCHAR(100),
  corte INTEGER,
  primera DECIMAL(10,2) DEFAULT 0,
  segunda DECIMAL(10,2) DEFAULT 0,
  tercera DECIMAL(10,2) DEFAULT 0,
  cuarta DECIMAL(10,2) DEFAULT 0,
  quinta DECIMAL(10,2) DEFAULT 0,
  verde DECIMAL(10,2) DEFAULT 0,
  gris DECIMAL(10,2) DEFAULT 0,
  scrap DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clasificaciones_tenant ON clasificaciones(tenant_id);

-- 6. Administrative
CREATE TABLE categorias_mano_obra (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  tipo_pago VARCHAR(50),
  costo_jornal DECIMAL(10,2)
);

CREATE TABLE registros_mano_obra (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  categoria_id UUID REFERENCES categorias_mano_obra(id),
  cantidad DECIMAL(10,2),
  costo_total DECIMAL(10,2),
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE impuestos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  tipo VARCHAR(50),
  periodo DATE NOT NULL,
  presupuesto DECIMAL(10,2),
  real DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
