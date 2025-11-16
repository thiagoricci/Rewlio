import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


async function sendSMS(to: string, message: string, accountSid: string, authToken: string, fromNumber: string): Promise<void> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const formData = new URLSearchParams();
  formData.append('To', to);
  formData.append('From', fromNumber);
  formData.append('Body', message);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Twilio error:', error);
    throw new Error(`Failed to send SMS: ${error}`);
  }
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Parse form data from Twilio
    const formData = await req.formData();
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;

    console.log('Received SMS from:', from, 'to:', to);
    console.log('Message:', body);

    if (!from || !to || !body) {
      console.error('Missing From, To, or Body');
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { status: 200, headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Look up which user owns this Twilio phone number
    const { data: credentials, error: credError } = await supabase
      .from('user_credentials')
      .select('user_id, twilio_account_sid, twilio_auth_token, twilio_phone_number')
      .eq('twilio_phone_number', to)
      .single();

    if (credError || !credentials) {
      console.error('Error finding user for phone number:', to, credError);
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { status: 200, headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // ALWAYS log the incoming message first (regardless of pending request)
    const messageSid = formData.get('MessageSid') as string;
    const { error: logError } = await supabase
      .from('sms_messages')
      .insert({
        user_id: credentials.user_id,
        phone_number: from,
        message_body: body,
        direction: 'inbound',
        twilio_message_sid: messageSid,
        request_id: null  // Will be updated if there's a matching request
      });

    if (logError) {
      console.error('Error logging inbound message:', logError);
    }

    console.log('Incoming message saved to database');

    // Then check if this is a reply to a pending request
    const { data: requests, error: findError } = await supabase
      .from('info_requests')
      .select('*')
      .eq('recipient_phone', from)
      .eq('user_id', credentials.user_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (findError || !requests || requests.length === 0) {
      console.log('No pending request found for:', from, '- message saved as general inbound');
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { status: 200, headers: { 'Content-Type': 'text/xml' } }
      );
    }

    const request = requests[0];
    console.log('Found pending request:', request.request_id);

    // Update the message with the request_id
    const { error: updateError } = await supabase
      .from('sms_messages')
      .update({ request_id: request.request_id })
      .eq('twilio_message_sid', messageSid);

    if (updateError) {
      console.error('Error updating message with request_id:', updateError);
    }

    // Accept any non-empty response as valid
    const trimmedBody = body.trim();
    
    if (trimmedBody.length > 0) {
      // Update request as completed
      const { error: updateError } = await supabase
        .from('info_requests')
        .update({
          status: 'completed',
          received_value: trimmedBody,
          received_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) {
        console.error('Error updating request:', updateError);
      } else {
        console.log('Request completed successfully');
      }
    } else {
      console.log('Empty response received, ignoring');
    }

    // Return empty TwiML response
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { status: 200, headers: { 'Content-Type': 'text/xml' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { status: 200, headers: { 'Content-Type': 'text/xml' } }
    );
  }
});
