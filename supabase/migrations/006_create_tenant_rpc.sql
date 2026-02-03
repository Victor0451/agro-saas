-- Secure Function to create a tenant and assign it to the user
-- This runs with SECURITY DEFINER, meaning it bypasses RLS and runs as superuser/owner.

CREATE OR REPLACE FUNCTION create_owner_tenant(
  tenant_name TEXT, 
  owner_id UUID
) 
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public -- Secure search path
AS $$
DECLARE
  new_tenant_id UUID;
  new_tenant JSONB;
  slug_base TEXT;
  final_slug TEXT;
BEGIN
  -- 1. Generate Slug
  slug_base := lower(regexp_replace(tenant_name, '[^a-zA-Z0-9]', '-', 'g'));
  final_slug := slug_base || '-' || floor(random() * 1000)::text;

  -- 2. Insert Tenant
  INSERT INTO tenants (nombre, slug, activo)
  VALUES (tenant_name, final_slug, true)
  RETURNING id INTO new_tenant_id;

  -- 3. Update User (Assign Tenant and ensure Role is admin)
  UPDATE usuarios 
  SET tenant_id = new_tenant_id,
      rol = 'admin'
  WHERE id = owner_id;

  -- 4. Return the new tenant data
  SELECT to_jsonb(t) INTO new_tenant FROM tenants t WHERE id = new_tenant_id;
  
  RETURN new_tenant;
END;
$$;
