-- Add subscription fields to tenants
ALTER TABLE tenants 
ADD COLUMN plan_type text DEFAULT 'BASIC' CHECK (plan_type IN ('FREE', 'BASIC', 'PRO', 'ENTERPRISE')),
ADD COLUMN max_fincas int DEFAULT 1;

-- Function to check limit before inserting farm
CREATE OR REPLACE FUNCTION check_finca_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count int;
    allowed_count int;
BEGIN
    SELECT count(*) INTO current_count FROM fincas WHERE tenant_id = NEW.tenant_id;
    SELECT max_fincas INTO allowed_count FROM tenants WHERE id = NEW.tenant_id;
    
    IF current_count >= allowed_count THEN
        RAISE EXCEPTION 'Plan limit reached. Upgrade to add more farms.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_finca_limit
BEFORE INSERT ON fincas
FOR EACH ROW
EXECUTE FUNCTION check_finca_limit();
