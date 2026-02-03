-- Modify Cosechas Table (It already exists in 001_initial_schema.sql)
DO $$
BEGIN
    -- Add finca_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cosechas' AND column_name = 'finca_id') THEN
        ALTER TABLE cosechas ADD COLUMN finca_id UUID REFERENCES fincas(id) ON DELETE CASCADE;
    END IF;

    -- Add kilos_brutos if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cosechas' AND column_name = 'kilos_brutos') THEN
        ALTER TABLE cosechas ADD COLUMN kilos_brutos DECIMAL(10,2) CHECK (kilos_brutos > 0);
    END IF;

    -- Add cantidad_bultos if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cosechas' AND column_name = 'cantidad_bultos') THEN
        ALTER TABLE cosechas ADD COLUMN cantidad_bultos INTEGER DEFAULT 0;
    END IF;

    -- Add clase if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cosechas' AND column_name = 'clase') THEN
        ALTER TABLE cosechas ADD COLUMN clase VARCHAR;
    END IF;

    -- Add observaciones if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cosechas' AND column_name = 'observaciones') THEN
        ALTER TABLE cosechas ADD COLUMN observaciones TEXT;
    END IF;
END $$;

-- Indices
CREATE INDEX IF NOT EXISTS idx_cosechas_finca ON cosechas(finca_id);
CREATE INDEX IF NOT EXISTS idx_cosechas_lote ON cosechas(lote_id);
CREATE INDEX IF NOT EXISTS idx_cosechas_fecha ON cosechas(fecha);

-- RLS Policies
ALTER TABLE cosechas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view cosechas of their tenant" ON cosechas;
CREATE POLICY "Users can view cosechas of their tenant" ON cosechas
    FOR SELECT USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Users can insert cosechas of their tenant" ON cosechas;
CREATE POLICY "Users can insert cosechas of their tenant" ON cosechas
    FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Users can update cosechas of their tenant" ON cosechas;
CREATE POLICY "Users can update cosechas of their tenant" ON cosechas
    FOR UPDATE USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Users can delete cosechas of their tenant" ON cosechas;
CREATE POLICY "Users can delete cosechas of their tenant" ON cosechas
    FOR DELETE USING (tenant_id = get_current_tenant_id());
