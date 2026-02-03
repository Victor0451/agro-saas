-- Create Personal table
CREATE TABLE IF NOT EXISTS personal (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    dni VARCHAR(50),
    legajo VARCHAR(50),
    tipo VARCHAR(50) DEFAULT 'Temporario', -- 'Permanente', 'Temporario'
    costo_jornal_referencia DECIMAL(10,2) DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for Personal
CREATE INDEX IF NOT EXISTS idx_personal_tenant ON personal(tenant_id);

-- Create Labores Personal (Assignment) table
CREATE TABLE IF NOT EXISTS labores_personal (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    labor_id UUID NOT NULL REFERENCES labores(id) ON DELETE CASCADE,
    personal_id UUID NOT NULL REFERENCES personal(id) ON DELETE RESTRICT,
    dias_trabajados DECIMAL(5,2) DEFAULT 1.00,
    costo_asignado DECIMAL(10,2) DEFAULT 0, -- Snapshot of cost at time of labor
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for Labores Personal
CREATE INDEX IF NOT EXISTS idx_labores_personal_labor ON labores_personal(labor_id);
CREATE INDEX IF NOT EXISTS idx_labores_personal_personnel ON labores_personal(personal_id);

-- RLS Policies
ALTER TABLE personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE labores_personal ENABLE ROW LEVEL SECURITY;

-- Personal Policies
DROP POLICY IF EXISTS "Users can view personnel of their tenant" ON personal;
CREATE POLICY "Users can view personnel of their tenant" ON personal
    FOR SELECT USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Users can manage personnel of their tenant" ON personal;
CREATE POLICY "Users can manage personnel of their tenant" ON personal
    FOR ALL USING (tenant_id = get_current_tenant_id());

-- Labores Personal Policies
DROP POLICY IF EXISTS "Users can view labor assignments of their tenant" ON labores_personal;
CREATE POLICY "Users can view labor assignments of their tenant" ON labores_personal
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM labores l WHERE l.id = labores_personal.labor_id AND l.tenant_id = get_current_tenant_id())
    );

DROP POLICY IF EXISTS "Users can manage labor assignments of their tenant" ON labores_personal;
CREATE POLICY "Users can manage labor assignments of their tenant" ON labores_personal
    FOR ALL USING (
         EXISTS (SELECT 1 FROM labores l WHERE l.id = labores_personal.labor_id AND l.tenant_id = get_current_tenant_id())
    );
