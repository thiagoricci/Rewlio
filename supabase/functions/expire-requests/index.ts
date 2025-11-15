import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Starting expiration check...');

    // Find all pending requests that have expired
    const { data: expiredRequests, error: findError } = await supabase
      .from('info_requests')
      .select('*')
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

    if (findError) {
      console.error('Error finding expired requests:', findError);
      return new Response(
        JSON.stringify({ error: 'Database error', details: findError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${expiredRequests?.length || 0} expired requests`);

    if (expiredRequests && expiredRequests.length > 0) {
      // Update all to expired
      const ids = expiredRequests.map(r => r.id);
      const { error: updateError } = await supabase
        .from('info_requests')
        .update({ status: 'expired' })
        .in('id', ids);

      if (updateError) {
        console.error('Error updating requests:', updateError);
      } else {
        console.log(`Updated ${ids.length} requests to expired`);

        // Send timeout SMS to each
        const timeoutMessage = `This request has expired.

If you're still on the call, ask the agent to send a new request.`;

        for (const request of expiredRequests) {
          try {
            await sendSMS(request.recipient_phone, timeoutMessage);
            console.log(`Sent timeout SMS to ${request.recipient_phone}`);
          } catch (smsError) {
            console.error(`Failed to send timeout SMS to ${request.recipient_phone}:`, smsError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredRequests?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
