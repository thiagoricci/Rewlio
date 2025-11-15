-- Create user credentials table for storing Twilio credentials
CREATE TABLE public.user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  twilio_account_sid text NOT NULL,
  twilio_auth_token text NOT NULL,
  twilio_phone_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_credentials
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credentials
CREATE POLICY "Users can view their own credentials"
  ON public.user_credentials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials"
  ON public.user_credentials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials"
  ON public.user_credentials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to credentials"
  ON public.user_credentials FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add user_id column to info_requests
ALTER TABLE public.info_requests ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_info_requests_user_id ON public.info_requests(user_id);

-- Drop the existing service role policy
DROP POLICY IF EXISTS "Service role has full access" ON public.info_requests;

-- Create new RLS policies for info_requests with user isolation
CREATE POLICY "Users can view their own requests"
  ON public.info_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own requests"
  ON public.info_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to requests"
  ON public.info_requests FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on user_credentials
CREATE TRIGGER update_user_credentials_updated_at
  BEFORE UPDATE ON public.user_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();