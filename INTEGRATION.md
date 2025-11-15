# SMS Information Collection - Integration Guide

## Overview
This system allows Retell AI voice agents to collect hard-to-spell information (emails, addresses, account numbers) from callers via SMS.

## Architecture

### Backend Functions
Three Lovable Cloud edge functions power the system:

1. **retell-webhook** - Main endpoint for Retell AI
   - Receives info requests from voice agent
   - Creates request in database
   - Sends SMS to caller
   - Polls for response (up to 5 minutes)
   - Returns validated data to AI

2. **twilio-webhook** - SMS response handler
   - Receives incoming SMS from Twilio
   - Validates information based on type
   - Updates database with result
   - Sends confirmation or error SMS

3. **expire-requests** - Background cleanup job
   - Finds expired pending requests
   - Marks them as expired
   - Sends timeout SMS to callers

### Database Schema
```sql
TABLE: info_requests
- id (uuid)
- request_id (varchar) - 6-char unique ID
- call_id (varchar) - Retell call identifier
- info_type (enum: email, address, account_number)
- recipient_phone (varchar) - E.164 format
- prompt_message (text, optional)
- received_value (text) - Validated response
- status (enum: pending, completed, expired, invalid)
- created_at (timestamp)
- received_at (timestamp, optional)
- expires_at (timestamp) - 5 minutes from creation
```

## Retell AI Setup

### 1. Configure Function in Retell Dashboard

Add this function definition:

```json
{
  "name": "collect_info_via_sms",
  "description": "Send SMS to collect hard-to-spell information from caller",
  "parameters": {
    "type": "object",
    "properties": {
      "info_type": {
        "type": "string",
        "enum": ["email", "address", "account_number"],
        "description": "Type of information to collect"
      }
    },
    "required": ["info_type"]
  }
}
```

### 2. Set Webhook URL

Configure your function webhook endpoint:
```
https://kqzsgqqwnthclrlcfkgs.supabase.co/functions/v1/retell-webhook
```

### 3. Update Agent Prompt

Example agent instruction:

```
When the customer needs to provide their email address, physical address, 
or account number, use the collect_info_via_sms function.

Say: "To make sure I get that exactly right, I'll send you a quick text. 
Just reply with your {info_type} and we'll continue."

Once you receive the information, confirm it:
"Perfect, I've got {value}. Let's continue..."
```

## Twilio Setup

### 1. Configure Webhook

In your Twilio phone number settings, set the SMS webhook:

```
Webhook URL: https://kqzsgqqwnthclrlcfkgs.supabase.co/functions/v1/twilio-webhook
Method: POST
```

### 2. Environment Variables

The following secrets are already configured in Lovable Cloud:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

## API Endpoints

### POST /functions/v1/retell-webhook

**Request Body:**
```json
{
  "call_id": "string",
  "caller_number": "+12345678901",
  "info_type": "email",
  "prompt_message": "optional custom message"
}
```

**Response (Success):**
```json
{
  "success": true,
  "request_id": "ABC123",
  "value": "john@example.com",
  "received_at": "2024-01-15T10:30:00Z"
}
```

**Response (Timeout):**
```json
{
  "success": false,
  "request_id": "ABC123",
  "error": "Request timed out"
}
```

### POST /functions/v1/twilio-webhook

Receives Twilio SMS webhook (form-encoded):
- `From`: Phone number
- `Body`: Message text

Returns empty TwiML response.

## Validation Rules

### Email
- Format: `name@domain.com`
- Normalized: lowercase, trimmed
- Error: "Please use format: name@example.com"

### Address
- Must contain street number (digits)
- Minimum 15 characters
- Error: "Please include street number, city, state, and ZIP"

### Account Number
- Extract digits only
- 5-20 digits
- Error: "Account number must be 5-20 digits"

## SMS Message Templates

### Request
```
Hi! To continue with your call, please reply with your {type}.

Example: john.smith@email.com

Request ID: ABC123
```

### Confirmation
```
✓ Got it!

Your {type}: {value}

Continuing with your call...
```

### Error
```
That doesn't look right.

{error_message}

Please reply again with the correct information.
```

### Timeout
```
This request has expired.

If you're still on the call, ask the agent to send a new request.
```

## Dashboard

Access the admin dashboard at `/dashboard` to:
- View all requests (last 100)
- Filter by status (pending, completed, expired)
- Search by phone number or call ID
- Real-time updates (auto-refresh every 5s)

Phone numbers are masked for privacy: `+1***\*\*\*8901`

## Background Jobs

The `expire-requests` function should run every minute via cron:

```sql
SELECT cron.schedule(
  'expire-sms-requests',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://kqzsgqqwnthclrlcfkgs.supabase.co/functions/v1/expire-requests',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

## Testing

### Test SMS Flow

1. Call the retell-webhook function:
```bash
curl -X POST https://kqzsgqqwnthclrlcfkgs.supabase.co/functions/v1/retell-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "test-call-123",
    "caller_number": "+1234567890",
    "info_type": "email"
  }'
```

2. Check your phone for SMS
3. Reply with a test email
4. Verify in dashboard that request completed

### Validation Tests

**Valid Email:**
```
john@example.com ✅
```

**Invalid Email:**
```
notanemail ❌
```

**Valid Address:**
```
123 Main Street, Springfield, IL 62701 ✅
```

**Invalid Address:**
```
Just a city ❌
```

**Valid Account Number:**
```
1234567890 ✅
12-345-678 ✅ (normalizes to 12345678)
```

## Monitoring

### Logs
View function logs in Lovable Cloud:
- Click "Cloud" tab
- Navigate to "Functions"
- Select function name
- View execution logs

### Metrics to Monitor
- Request creation rate
- SMS delivery success rate
- Average response time
- Validation success rate
- Timeout rate

## Security

### Data Protection
- Phone numbers masked in UI
- RLS policies on database
- HTTPS only
- No PII in logs

### Rate Limiting
Consider implementing rate limiting:
- Max 5 requests per phone number per hour
- Prevents abuse and spam

## Troubleshooting

### SMS Not Received
1. Check Twilio account balance
2. Verify phone number is valid E.164 format
3. Check function logs for errors
4. Verify TWILIO secrets are set

### Request Timeout
1. Check if SMS was delivered
2. Verify twilio-webhook is receiving responses
3. Check validation logic
4. Review database for pending requests

### Invalid Responses
1. Review validation logic in twilio-webhook
2. Check error messages sent to users
3. Update validation rules if needed

## Support

For issues or questions:
- Check function logs in Lovable Cloud
- Review database records in Cloud console
- Test with known valid inputs
