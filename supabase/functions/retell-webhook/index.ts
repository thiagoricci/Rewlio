import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  call_id: string;
  caller_number: string;
  info_type: 'email' | 'address' | 'account_number';
  prompt_message?: string;
}

function generateRequestId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function sendSMS(to: string, message: string): Promise<void> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const formData = new URLSearchParams();
  formData.append('To', to);
  formData.append('From', fromNumber!);
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

  console.log('SMS sent successfully to', to);
}

function getInfoTypeLabel(infoType: string): string {
  switch (infoType) {
    case 'email': return 'email address';
    case 'address': return 'full address';
    case 'account_number': return 'account number';
    default: return 'information';
  }
}

function getInfoTypeExample(infoType: string): string {
  switch (infoType) {
    case 'email': return 'john.smith@email.com';
    case 'address': return '123 Main St, Springfield, IL 62701';
    case 'account_number': return '1234567890';
    default: return '';
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

    const body: RequestBody = await req.json();
    console.log('Received request:', body);

    // Validate request
    if (!body.call_id || !body.caller_number || !body.info_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique request ID
    const requestId = generateRequestId();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Create request in database
    const { data: request, error: dbError } = await supabase
      .from('info_requests')
      .insert({
        request_id: requestId,
        call_id: body.call_id,
        info_type: body.info_type,
        recipient_phone: body.caller_number,
        prompt_message: body.prompt_message,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Database error', details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send SMS
    const label = getInfoTypeLabel(body.info_type);
    const example = getInfoTypeExample(body.info_type);
    const smsMessage = `Hi! To continue with your call, please reply with your ${label}.

Example: ${example}

Request ID: ${requestId}`;

    try {
      await sendSMS(body.caller_number, smsMessage);
    } catch (smsError) {
      console.error('SMS error:', smsError);
      // Mark request as failed but don't fail the whole request
      await supabase
        .from('info_requests')
        .update({ status: 'expired' })
        .eq('id', request.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to send SMS', details: String(smsError) }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Request created successfully:', requestId);

    // Poll for response (wait up to 5 minutes)
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds
    const timeout = 5 * 60 * 1000; // 5 minutes

    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const { data: updatedRequest } = await supabase
        .from('info_requests')
        .select('*')
        .eq('request_id', requestId)
        .single();

      if (updatedRequest && updatedRequest.status === 'completed') {
        return new Response(
          JSON.stringify({
            success: true,
            request_id: requestId,
            value: updatedRequest.received_value,
            received_at: updatedRequest.received_at
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (updatedRequest && (updatedRequest.status === 'expired' || updatedRequest.status === 'invalid')) {
        return new Response(
          JSON.stringify({
            success: false,
            request_id: requestId,
            status: updatedRequest.status,
            error: 'Request expired or invalid'
          }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Timeout - mark as expired
    await supabase
      .from('info_requests')
      .update({ status: 'expired' })
      .eq('request_id', requestId);

    return new Response(
      JSON.stringify({
        success: false,
        request_id: requestId,
        error: 'Request timed out'
      }),
      { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
