-- Enable RLS on user_credits if not already enabled
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Users can view their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Service role has full access to credits" ON public.user_credits;

-- Re-create the policy for users to view ONLY their own credits
CREATE POLICY "Users can view their own credits"
  ON public.user_credits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Re-create the policy for service role access
CREATE POLICY "Service role has full access to credits"
  ON public.user_credits
  FOR ALL
  USING (true)
  WITH CHECK (true);