-- Remove info_type column from info_requests table
ALTER TABLE public.info_requests
DROP COLUMN IF EXISTS info_type;