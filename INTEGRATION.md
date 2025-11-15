# SMS Information Collection - Integration Guide

## Overview
This system allows Retell AI voice agents to collect hard-to-spell information (emails, addresses, account numbers) from callers via SMS.

**Multi-Tenant Architecture:** Each user has their own Twilio credentials, enabling multiple users to run independent SMS collection systems with their own phone numbers and billing.

## Architecture

### Backend Functions
Three Lovable Cloud edge functions power the system:

1. **retell-webhook** - Main endpoint for Retell AI
   - Receives info requests from voice agent
   - Validates user authentication
   - Fetches user's Twilio credentials from database
   - Creates request in database
   - Sends SMS to caller using user's credentials
   - Polls for response (up to 5 minutes)
   - Returns validated data to AI

2. **twilio-webhook** - SMS response handler
   - Receives incoming SMS from Twilio
   - Identifies user by phone number (To field)
   - Validates information based on type
   - Updates database with result
   - Sends confirmation or error SMS using user's credentials

3. **expire-requests** - Background cleanup job
   - Finds expired pending requests
   - Marks them as expired
   - Sends timeout SMS to callers using respective user's credentials

### Database Schema
```sql
TABLE: user_credentials
- id (uuid)
- user_id (uuid) - References auth.users
- twilio_account_sid (text)
- twilio_auth_token (text)
- twilio_phone_number (text)
- created_at (timestamp)
- updated_at (timestamp)

TABLE: info_requests
- id (uuid)
- request_id (varchar) - 6-char unique ID
- call_id (varchar) - Retell call identifier
- user_id (uuid) - Owner of the request
- info_type (enum: email, address, account_number)
- recipient_phone (varchar) - E.164 format
- prompt_message (text, optional)
- received_value (text) - Validated response
- status (enum: pending, completed, expired, invalid)
- created_at (timestamp)
- received_at (timestamp, optional)
- expires_at (timestamp) - 5 minutes from creation
```

## User Setup

### Authentication
Users must sign up and log in to use the system:
1. Navigate to the application
2. Sign up with email and password
3. Configure Twilio credentials in Settings

### Twilio Credentials Configuration
Each user must configure their own Twilio credentials:

1. **Get Twilio Credentials:**
   - Sign up at [twilio.com](https://www.twilio.com)
   - Get Account SID and Auth Token from console
   - Purchase a phone number with SMS capabilities

2. **Configure in Application:**
   - Navigate to Settings page
   - Enter your Twilio Account SID
   - Enter your Twilio Auth Token
   - Enter your Twilio Phone Number (E.164 format: +12345678901)
   - Click Save

3. **Configure Twilio Webhook:**
   In your Twilio phone number settings, set the SMS webhook:
   ```
   Webhook URL: https://kqzsgqqwnthclrlcfkgs.supabase.co/functions/v1/twilio-webhook
   Method: POST
   ```
   **Note:** The webhook will identify your account by the phone number (To field).

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
      },
      "user_id": {
        "type": "string",
        "description": "Authenticated user ID (required for multi-tenant support)"
      }
    },
    "required": ["info_type", "user_id"]
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
or account number, use the collect_info_via_sms function with your user_id.

Say: "To make sure I get that exactly right, I'll send you a quick text. 
Just reply with your {info_type} and we'll continue."

Once you receive the information, confirm it:
"Perfect, I've got {value}. Let's continue..."
```

**Note:** The user_id should be passed from your authentication system to identify which Twilio account to use.

## API Endpoints

### POST /functions/v1/retell-webhook

**Authentication:** Requires valid session token in Authorization header

**Request Body:**
```json
{
  "call_id": "string",
  "caller_number": "+12345678901",
  "info_type": "email",
  "user_id": "uuid-string",
  "message": "optional custom message"
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

**Response (No Credentials):**
```json
{
  "success": false,
  "error": "User Twilio credentials not found. Please configure them in Settings."
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
- `From`: Sender's phone number
- `To`: Your Twilio phone number (used to identify user account)
- `Body`: Message text

Returns empty TwiML response.

**Note:** The system automatically identifies the correct user account based on the `To` field (your Twilio phone number).

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

Access the dashboard at `/dashboard` to:
- View your requests (last 100)
- Filter by status (pending, completed, expired)
- Search by phone number or call ID
- Real-time updates (auto-refresh every 5s)

**Privacy:** 
- Users only see their own requests
- Phone numbers are masked: `+1***\*\*\*8901`

**Authentication Required:** You must be logged in to access the dashboard.

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

### Test Page

The application includes a test page at `/test` to verify your setup:

1. **Prerequisites:**
   - You must be logged in
   - Your Twilio credentials must be configured in Settings

2. **Steps:**
   - Navigate to `/test`
   - Enter a test call ID
   - Enter your phone number (E.164 format)
   - Select info type (email, address, or account_number)
   - Customize the message if desired
   - Click "Send Test SMS"

3. **Verification:**
   - Check your phone for SMS
   - Reply with test data
   - Verify in dashboard that request completed

### Manual API Test

Test the retell-webhook function with authentication:
```bash
# First, get your session token by logging into the app
# Then use it in the Authorization header

curl -X POST https://kqzsgqqwnthclrlcfkgs.supabase.co/functions/v1/retell-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "call_id": "test-call-123",
    "caller_number": "+1234567890",
    "info_type": "email",
    "user_id": "your-user-id"
  }'
```

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
- Each user's data is isolated with Row-Level Security (RLS)
- Users can only access their own requests and credentials
- Phone numbers masked in UI
- HTTPS only
- No PII in logs

### Authentication
- Email/password authentication required
- Session-based access control
- All API endpoints validate user identity

### Twilio Credentials
- Stored encrypted in database
- Never exposed to client-side code
- Each user manages their own credentials
- No shared credentials between users

### Rate Limiting
Consider implementing rate limiting:
- Max 5 requests per phone number per hour per user
- Prevents abuse and spam
- Protects Twilio account balance

## Troubleshooting

### "User Twilio credentials not found"
1. Log in to the application
2. Navigate to Settings
3. Configure your Twilio credentials
4. Verify all three fields are filled correctly

### SMS Not Received
1. Check Twilio account balance
2. Verify phone number is valid E.164 format (+12345678901)
3. Check function logs for errors
4. Verify your Twilio credentials are correct in Settings
5. Confirm Twilio webhook is configured for your phone number

### Request Timeout
1. Check if SMS was delivered in Twilio console
2. Verify twilio-webhook is receiving responses
3. Check that phone number in Twilio webhook matches your configured number
4. Review database for pending requests
5. Check validation logic matches your response format

### Invalid Responses
1. Review validation logic in twilio-webhook
2. Check error messages sent to users
3. Verify the info_type matches the data format
4. Update validation rules if needed

### Cannot See Requests in Dashboard
1. Verify you are logged in
2. Check that requests have your user_id in the database
3. Confirm RLS policies are correctly configured
4. Try refreshing the page

## Support

For issues or questions:
- Check function logs in Lovable Cloud dashboard
- Review database records in Cloud console
- Test with known valid inputs using the Test page
- Verify Twilio credentials are correctly configured
