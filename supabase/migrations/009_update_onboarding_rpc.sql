CREATE OR REPLACE FUNCTION create_owner_tenant(
  tenant_name text,
  finca_name text,
  superficie numeric DEFAULT 0,
  rendimiento numeric DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id uuid;
  new_user_id uuid;
  slug_base text;
  final_slug text;
BEGIN
  -- 1. Generate Slug
  slug_base := lower(regexp_replace(tenant_name, '[^a-zA-Z0-9]', '-', 'g'));
  final_slug := slug_base || '-' || floor(random() * 1000)::text;

  -- 2. Create Tenant
  INSERT INTO tenants (nombre, slug, activo)
  VALUES (tenant_name, final_slug, true)
  RETURNING id INTO new_tenant_id;

  -- 3. Get User ID
  new_user_id := auth.uid();

  -- 4. Assign User to Tenant (Owner/Admin)
  UPDATE usuarios
  SET tenant_id = new_tenant_id,
      rol = 'admin'
  WHERE id = new_user_id;

  -- 5. Create First Farm
  INSERT INTO fincas (nombre, tenant_id, superficie_total, rendimiento_esperado)
  VALUES (finca_name, new_tenant_id, superficie, rendimiento);

  -- Return result
  RETURN json_build_object(
    'tenant_id', new_tenant_id,
    'message', 'Tenant and First Farm created successfully'
  );
END;
$$;
