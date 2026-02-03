-- Enable full access for tenant users to Labores
DROP POLICY IF EXISTS "Users can manage labors of their tenant" ON labores;
CREATE POLICY "Users can manage labors of their tenant" ON labores
    FOR ALL USING (tenant_id = get_current_tenant_id());

-- For safety, ensure we cleanup the old restrictive policies if they conflict (Postgres usually handles separate policies as OR, but ALL is cleaner)
DROP POLICY IF EXISTS "Users can view labors of their tenant" ON labores;
DROP POLICY IF EXISTS "Users can insert labors of their tenant" ON labores;
