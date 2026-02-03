-- Create Audit Logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, ERROR
  resource VARCHAR(100) NOT NULL, -- e.g., 'fincas', 'lotes', '/api/fincas'
  resource_id UUID, -- ID of the affected record (optional)
  payload JSONB DEFAULT '{}', -- The data sent/changes
  metadata JSONB DEFAULT '{}', -- IP, User Agent, Response Status, Duration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admins can view logs of their tenant
CREATE POLICY "Admins can view tenant logs" ON audit_logs
  FOR SELECT
  USING (
    tenant_id = get_current_tenant_id() 
    AND 
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid()::uuid 
      AND rol = 'admin'
    )
  );

-- System can insert logs (or authenticated users via API)
CREATE POLICY "Users can insert logs" ON audit_logs
  FOR INSERT
  WITH CHECK (
    tenant_id = get_current_tenant_id() OR tenant_id IS NULL
  );
