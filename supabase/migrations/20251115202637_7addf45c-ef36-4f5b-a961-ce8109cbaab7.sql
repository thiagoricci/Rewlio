-- Create enum for info types
CREATE TYPE public.info_type AS ENUM ('email', 'address', 'account_number');

-- Create enum for request status
CREATE TYPE public.request_status AS ENUM ('pending', 'completed', 'expired', 'invalid');

-- Create info_requests table
CREATE TABLE public.info_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(20) UNIQUE NOT NULL,
  call_id VARCHAR(100) NOT NULL,
  info_type info_type NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  prompt_message TEXT,
  received_value TEXT,
  status request_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_info_requests_request_id ON public.info_requests(request_id);
CREATE INDEX idx_info_requests_recipient_phone ON public.info_requests(recipient_phone, status);
CREATE INDEX idx_info_requests_expires_at ON public.info_requests(expires_at) WHERE status = 'pending';
CREATE INDEX idx_info_requests_created_at ON public.info_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.info_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to access everything (for API routes)
CREATE POLICY "Service role has full access"
  ON public.info_requests
  FOR ALL
  USING (true)
  WITH CHECK (true);