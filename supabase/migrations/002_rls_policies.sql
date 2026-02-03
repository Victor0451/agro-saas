-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE fincas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE almacigos ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE fertilizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosechas ENABLE ROW LEVEL SECURITY;
ALTER TABLE estufas ENABLE ROW LEVEL SECURITY;
ALTER TABLE curados ENABLE ROW LEVEL SECURITY;
ALTER TABLE clasificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_mano_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE impuestos ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()::uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for Tenants
-- Users can view their own tenant
CREATE POLICY "Users can view own tenant" ON tenants
  FOR SELECT USING (id = get_current_tenant_id());

-- Policies for Users
-- Users can view other users in SAME tenant
CREATE POLICY "Users can view tenant members" ON usuarios
  FOR SELECT USING (tenant_id = get_current_tenant_id());

-- GENERIC POLICIES FOR DATA TABLES
-- We'll create a standard set of policies for data tables

-- Fincas
CREATE POLICY "Tenant isolation for fincas" ON fincas
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- Lotes
CREATE POLICY "Tenant isolation for lotes" ON lotes
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- Insumos
CREATE POLICY "Tenant isolation for insumos" ON insumos
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- Produccion tables
CREATE POLICY "Tenant isolation for almacigos" ON almacigos
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for plantaciones" ON plantaciones
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for fertilizaciones" ON fertilizaciones
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for cultivos" ON cultivos
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for cosechas" ON cosechas
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- Post Harvest
CREATE POLICY "Tenant isolation for estufas" ON estufas
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for curados" ON curados
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for clasificaciones" ON clasificaciones
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- Admin
CREATE POLICY "Tenant isolation for registros_mano_obra" ON registros_mano_obra
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for impuestos" ON impuestos
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());
