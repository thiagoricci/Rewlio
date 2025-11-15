-- Fix sms_messages table
DROP POLICY IF EXISTS "Users can view their own messages" ON sms_messages;
CREATE POLICY "Authenticated users can view only their own messages" 
ON sms_messages 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own messages" ON sms_messages;
CREATE POLICY "Authenticated users can insert their own messages" 
ON sms_messages 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Fix info_requests table
DROP POLICY IF EXISTS "Users can view their own requests" ON info_requests;
CREATE POLICY "Authenticated users can view only their own requests" 
ON info_requests 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own requests" ON info_requests;
CREATE POLICY "Authenticated users can insert their own requests" 
ON info_requests 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Fix user_credentials table
DROP POLICY IF EXISTS "Users can view their own credentials" ON user_credentials;
CREATE POLICY "Authenticated users can view only their own credentials" 
ON user_credentials 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own credentials" ON user_credentials;
CREATE POLICY "Authenticated users can insert their own credentials" 
ON user_credentials 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own credentials" ON user_credentials;
CREATE POLICY "Authenticated users can update their own credentials" 
ON user_credentials 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);