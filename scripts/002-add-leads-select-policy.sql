-- Add SELECT policy for service role to read leads
-- The service role should bypass RLS, but adding explicit policy for safety

-- First, let's create a policy that allows authenticated service role to read
CREATE POLICY "Allow service role to read leads" ON leads
FOR SELECT
TO service_role
USING (true);

-- If that doesn't work, you can temporarily disable RLS for testing:
-- ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
