-- Fix service role policies to scope them correctly
-- These policies should only apply to service_role, not public

-- Fix sms_messages table
DROP POLICY IF EXISTS "Service role has full access to messages" ON sms_messages;
CREATE POLICY "Service role has full access to messages"
ON sms_messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix info_requests table
DROP POLICY IF EXISTS "Service role has full access to requests" ON info_requests;
CREATE POLICY "Service role has full access to requests"
ON info_requests
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix user_credentials table
DROP POLICY IF EXISTS "Service role has full access to credentials" ON user_credentials;
CREATE POLICY "Service role has full access to credentials"
ON user_credentials
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);