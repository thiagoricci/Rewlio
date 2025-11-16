-- Add DELETE RLS policy for sms_messages table
CREATE POLICY "Authenticated users can delete their own messages"
ON public.sms_messages
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Add DELETE RLS policy for info_requests table
CREATE POLICY "Authenticated users can delete their own requests"
ON public.info_requests
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);