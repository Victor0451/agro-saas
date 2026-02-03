-- Create Liquidaciones table
CREATE TABLE IF NOT EXISTS liquidaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    personal_id UUID REFERENCES personal(id), -- Nullable if we support batch (but plan says per person first?) Plan says "Selection de Personal (Multiple or Individual)". 
    -- If multiple, we might need a separate relation or this is a "Group Header"?
    -- For simplicity and per "Total adeudad por empleado", let's make 1 Liquidacion record PER EMPLOYEE. 
    -- If UI handles "Pay All", it generates N records.
    
    fecha_liquidacion DATE NOT NULL DEFAULT CURRENT_DATE,
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    
    total_dias DECIMAL(10,2) DEFAULT 0,
    total_a_pagar DECIMAL(12,2) DEFAULT 0,
    
    estado VARCHAR(50) DEFAULT 'Pagado', -- Pagado, Anulado
    observaciones TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Reference to Labores Personal
ALTER TABLE labores_personal 
ADD COLUMN IF NOT EXISTS liquidacion_id UUID REFERENCES liquidaciones(id) ON DELETE SET NULL;

-- Indices
CREATE INDEX IF NOT EXISTS idx_liquidaciones_tenant ON liquidaciones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_personal ON liquidaciones(personal_id);
CREATE INDEX IF NOT EXISTS idx_labores_personal_liquidacion ON labores_personal(liquidacion_id);

-- RLS
ALTER TABLE liquidaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view liquidations of their tenant" ON liquidaciones;
CREATE POLICY "Users can view liquidations of their tenant" ON liquidaciones
    FOR SELECT USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Users can manage liquidations of their tenant" ON liquidaciones;
CREATE POLICY "Users can manage liquidations of their tenant" ON liquidaciones
    FOR ALL USING (tenant_id = get_current_tenant_id());
