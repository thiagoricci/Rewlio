-- Change info_type from enum to text to support dynamic types from AI agent
ALTER TABLE info_requests 
  ALTER COLUMN info_type TYPE text;

-- Drop the old enum type
DROP TYPE IF EXISTS info_type CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_info_requests_info_type ON info_requests(info_type);