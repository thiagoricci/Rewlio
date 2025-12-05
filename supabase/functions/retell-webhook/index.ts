import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Test page payload structure
interface TestPagePayload {
  call_id: string;
  caller_number: string;
  message: string;
  user_id: string;
}

// Retell AI payload structure
interface RetellPayload {
  call: {
    call_id: string;
    from_number: string;
    [key: string]: any;
  };
  name: string;
  args: {
    message: string;
    user_id: string;
    [key: string]: any;
  };
}

function generateRequestId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function sendSMS(to: string, message: string, accountSid: string, authToken: string, fromNumber: string): Promise<string> {
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Extract user_id from URL path (e.g., /retell-webhook/user-id-here)
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const userIdFromPath = pathParts[pathParts.length - 1];
    
    const body = await req.json();
    console.log('Received request:', JSON.stringify(body, null, 2));

    // Detect payload structure and extract data
    const isRetellPayload = body.call !== undefined;
    
    let call_id: string;
    let caller_number: string;
    let message: string;
    let user_id: string;

    if (isRetellPayload) {
      // Retell AI payload structure
      const retellBody = body as RetellPayload;
      call_id = retellBody.call.call_id;
      caller_number = retellBody.call.from_number;
      message = retellBody.args.message;
      // Use user_id from URL path for Retell payloads
      user_id = userIdFromPath && userIdFromPath !== 'retell-webhook' ? userIdFromPath : retellBody.args.user_id;
      console.log('Parsed Retell payload:', { call_id, caller_number, message, user_id, userIdFromPath });
    } else {
      // Test page payload structure - use user_id from body
      const testBody = body as TestPagePayload;
      call_id = testBody.call_id;
      caller_number = testBody.caller_number;
      message = testBody.message;
      user_id = testBody.user_id;
      console.log('Parsed Test page payload:', { call_id, caller_number, message, user_id });
    }

    // Validate required fields
    if (!call_id || !caller_number || !message || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: call_id, caller_number, message, and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user credits before proceeding
    console.log('Checking credits for user:', user_id);
    let { data: creditsData, error: creditsError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user_id)
      .limit(1)
      .maybeSingle();

    // If user doesn't have credits row, create one with 20 free credits
    if (!creditsData && !creditsError) {
      console.log('No credits found for user, creating initial 20 credits');
      const { data: newCredits, error: insertError } = await supabase
        .from('user_credits')
        .insert({ user_id: user_id, credits: 20 })
        .select('credits')
        .single();

      if (insertError) {
        console.error('Error creating initial credits:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to initialize user credits' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      creditsData = newCredits;
      
      // Log the free credits transaction
      await supabase.from('credit_transactions').insert({
        user_id: user_id,
        amount: 20,
        type: 'free_signup',
        description: 'Free signup credits',
      });
    }

    if (creditsError) {
      console.error('Error fetching credits:', creditsError);
      return new Response(
        JSON.stringify({ error: 'Failed to check user credits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!creditsData || creditsData.credits < 1) {
      console.log('Insufficient credits for user:', user_id);
      return new Response(
        JSON.stringify({ error: 'Insufficient credits. Please purchase more credits to send SMS.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User has sufficient credits:', creditsData.credits);

    // Fetch user's Twilio credentials
    const { data: credentials, error: credError } = await supabase
      .from('user_credentials')
      .select('twilio_account_sid, twilio_auth_token, twilio_phone_number')
      .eq('user_id', user_id)
      .single();

    if (credError || !credentials) {
      console.error('Error fetching user credentials:', credError);
      return new Response(
        JSON.stringify({ error: 'User Twilio credentials not found. Please configure them in Settings.' }),
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
        call_id: call_id,
        recipient_phone: caller_number,
        prompt_message: message,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        user_id: user_id
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

    // Send SMS with the exact message from the AI agent
    let twilioMessageSid: string;
    try {
      twilioMessageSid = await sendSMS(
        caller_number, 
        message, 
        credentials.twilio_account_sid,
        credentials.twilio_auth_token,
        credentials.twilio_phone_number
      );
      console.log('SMS sent successfully with SID:', twilioMessageSid);
      
      // Deduct 1 credit after successful SMS send
      console.log('Deducting 1 credit from user:', user_id);
      const { error: deductError } = await supabase
        .from('user_credits')
        .update({ credits: creditsData.credits - 1 })
        .eq('user_id', user_id);

      if (deductError) {
        console.error('Error deducting credit:', deductError);
        // Don't fail the request since SMS was already sent
      } else {
        // Log the transaction
        await supabase.from('credit_transactions').insert({
          user_id: user_id,
          amount: -1,
          type: 'sms_sent',
          description: `SMS sent to ${caller_number}`,
        });
        console.log('Credit deducted successfully. New balance:', creditsData.credits - 1);
      }
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

    // Log the outbound message to sms_messages table for inbox display
    const { error: logError } = await supabase
      .from('sms_messages')
      .insert({
        user_id: user_id,
        phone_number: caller_number,
        message_body: message,
        direction: 'outbound',
        request_id: requestId,
        twilio_message_sid: twilioMessageSid
      });

    if (logError) {
      console.error('Error logging outbound request message:', logError);
      // Don't fail the request, just log the error
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
