-- Fix RLS policies for leads table
-- Drop existing policies
DROP POLICY IF EXISTS "Allow anonymous insert" ON leads;
DROP POLICY IF EXISTS "Allow service role select" ON leads;
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON leads;
DROP POLICY IF EXISTS "Enable read for service role" ON leads;

-- Disable RLS temporarily to allow all operations
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (for lead capture)
CREATE POLICY "Anyone can insert leads"
ON leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Create policy to allow service role to read all leads
CREATE POLICY "Service role can read all leads"
ON leads
FOR SELECT
TO service_role
USING (true);

-- Also allow authenticated users to read (for admin)
CREATE POLICY "Authenticated can read leads"
ON leads
FOR SELECT
TO authenticated
USING (true);
