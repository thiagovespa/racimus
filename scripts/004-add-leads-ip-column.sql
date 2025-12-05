-- Add ip_address column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Update existing leads with null IP (they were created before this feature)
UPDATE leads SET ip_address = 'N/A' WHERE ip_address IS NULL;
