import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendSMSRequest {
  phone_number: string;
  message_body: string;
}

async function sendTwilioSMS(
  to: string,
  message: string,
  accountSid: string,
  authToken: string,
  fromNumber: string
): Promise<string> {
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

  const responseData = await response.json();
  console.log('SMS sent successfully to', to, 'with SID:', responseData.sid);
  return responseData.sid;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { phone_number, message_body }: SendSMSRequest = await req.json();
    console.log('Send SMS request:', { phone_number, message_body, user_id: user.id });

    // Validate input
    if (!phone_number || !message_body) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing phone_number or message_body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (message_body.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Message cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (message_body.length > 1600) {
      return new Response(
        JSON.stringify({ success: false, error: 'Message too long (max 1600 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user's Twilio credentials
    const { data: credentials, error: credError } = await supabase
      .from('user_credentials')
      .select('twilio_account_sid, twilio_auth_token, twilio_phone_number')
      .eq('user_id', user.id)
      .single();

    if (credError || !credentials) {
      console.error('Error fetching credentials:', credError);
      return new Response(
        JSON.stringify({ success: false, error: 'Twilio credentials not configured. Please add them in Settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send SMS via Twilio
    let twilioMessageSid: string;
    try {
      twilioMessageSid = await sendTwilioSMS(
        phone_number,
        message_body,
        credentials.twilio_account_sid,
        credentials.twilio_auth_token,
        credentials.twilio_phone_number
      );
    } catch (smsError) {
      console.error('SMS sending error:', smsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send SMS via Twilio' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the outbound message to sms_messages table
    const { error: logError } = await supabase
      .from('sms_messages')
      .insert({
        user_id: user.id,
        phone_number: phone_number,
        message_body: message_body,
        direction: 'outbound',
        twilio_message_sid: twilioMessageSid,
        request_id: null,
      });

    if (logError) {
      console.error('Error logging message:', logError);
      // Don't fail the request, message was sent successfully
    }

    return new Response(
      JSON.stringify({ success: true, message_sid: twilioMessageSid }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
