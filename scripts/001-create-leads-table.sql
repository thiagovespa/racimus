-- Create leads table to store captured user information
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  matrix_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Enable RLS but allow all inserts (public form) and restrict reads to service role
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert leads (public form submission)
CREATE POLICY "Allow public lead insertion" ON leads 
  FOR INSERT 
  WITH CHECK (true);

-- Only service role can read/update/delete (admin access via server)
-- Note: Service role bypasses RLS, so no explicit SELECT policy needed for admin
