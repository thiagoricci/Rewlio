-- Create sms_messages table to store all SMS conversations
CREATE TABLE public.sms_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone_number VARCHAR NOT NULL,
  message_body TEXT NOT NULL,
  direction VARCHAR NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  twilio_message_sid VARCHAR,
  request_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_sms_messages_user_id ON public.sms_messages(user_id);
CREATE INDEX idx_sms_messages_phone_number ON public.sms_messages(phone_number);
CREATE INDEX idx_sms_messages_created_at ON public.sms_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own messages"
ON public.sms_messages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
ON public.sms_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to messages"
ON public.sms_messages
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sms_messages_updated_at
BEFORE UPDATE ON public.sms_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime for live message updates
ALTER TABLE public.sms_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sms_messages;