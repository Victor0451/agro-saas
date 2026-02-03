-- Allow authenticated users to INSERT into tenants (to create their own)
CREATE POLICY "Enable insert for authenticated users" ON tenants
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own profile (to set tenant_id)
-- Note: You might want to restrict this more in production (e.g., only can set tenant_id if it's currently null)
CREATE POLICY "Enable update for users on their own profile" ON usuarios
FOR UPDATE
USING (auth.uid() = id);
