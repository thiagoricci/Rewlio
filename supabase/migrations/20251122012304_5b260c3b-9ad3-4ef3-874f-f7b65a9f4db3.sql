-- Allow authenticated users to delete their own credentials
CREATE POLICY "Authenticated users can delete their own credentials"
ON public.user_credentials
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);