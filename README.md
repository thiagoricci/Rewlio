# Rewlio

**Rewlio** - A smooth, intelligent way to handle messages. This application seamlessly collects hard-to-spell information from voice calls via SMS.

## Overview

Rewlio is a multi-tenant platform that enables Retell AI voice agents to collect hard-to-spell information (emails, addresses, account numbers) from callers via SMS. Each user has their own Twilio credentials, enabling multiple users to run independent SMS collection systems with their own phone numbers and billing.

## Features

### Core Functionality

- **SMS Information Collection**: Collect hard-to-spell information from callers via SMS
- **Multi-Tenant Architecture**: Each user manages their own Twilio credentials and phone numbers
- **Real-Time Dashboard**: Monitor all information requests with live updates
- **Validation System**: Automatic validation for emails, addresses, and account numbers
- **Request Management**: View, filter, search, and delete information requests

### User Features

- **Authentication**: Secure signup and login system
- **Settings Page**: Configure Twilio credentials and view your unique webhook URL
- **Test Page**: Verify your SMS setup before going live
- **Inbox**: View and manage SMS conversations
- **Credits System**: Purchase credits via Stripe for SMS usage
- **Payment Integration**: Seamless Stripe checkout and webhook handling

### Integration Features

- **Retell AI Integration**: Custom webhook for voice agent function calls
- **Twilio Integration**: Send and receive SMS using your own Twilio account
- **Stripe Integration**: Process payments for credits
- **Supabase Backend**: Database and edge functions for scalability

## Tech Stack

### Frontend

- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe development
- **React 18** - UI library with hooks
- **React Router DOM** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components built on Radix UI

### Backend

- **Supabase** - Database, authentication, and edge functions
- **PostgreSQL** - Relational database with Row-Level Security (RLS)

### Integrations

- **Retell AI** - Voice agent platform
- **Twilio** - SMS messaging service
- **Stripe** - Payment processing

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- A Twilio account with SMS capabilities
- A Retell AI account
- A Stripe account (for credits system)

### Installation

```bash
# Clone the repository
git clone https://github.com/thiagoricci/Rewlio.git
cd Rewlio

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note**: The `.env` file is included in `.gitignore` and should not be committed to version control.

## User Guide

### 1. Sign Up and Login

1. Navigate to the application
2. Sign up with email and password
3. Log in to access the dashboard

### 2. Configure Twilio

Each user must configure their own Twilio credentials:

1. **Get Twilio Credentials**:
   - Sign up at [twilio.com](https://www.twilio.com)
   - Get Account SID and Auth Token from console
   - Purchase a phone number with SMS capabilities

2. **Configure in Application**:
   - Navigate to Settings page
   - Enter your Twilio Account SID
   - Enter your Twilio Auth Token
   - Enter your Twilio Phone Number (E.164 format: +12345678901)
   - Click Save

3. **Configure Twilio Webhook**:
   - In your Twilio phone number settings, set the SMS webhook:
   ```
   Webhook URL: https://your-project.supabase.co/functions/v1/twilio-webhook
   Method: POST
   ```

### 3. Configure Retell AI

After configuring your Twilio credentials:

1. **Get your unique webhook URL**:
   - Go to Settings page in the application
   - After saving your Twilio credentials, scroll down to "Retell AI Webhook Configuration"
   - Copy your unique webhook URL (format: `https://[project].supabase.co/functions/v1/retell-webhook/[your-user-id]`)

2. **Configure Function in Retell Dashboard**:

   Add this function definition:

   ```json
   {
     "name": "collect_info_via_sms",
     "description": "Send SMS to collect hard-to-spell information from caller",
     "parameters": {
       "type": "object",
       "properties": {
         "message": {
           "type": "string",
           "description": "The exact SMS message to send to the caller"
         },
         "info_type": {
           "type": "string",
           "enum": ["email", "address", "account_number"],
           "description": "Type of information to collect"
         }
       },
       "required": ["message", "info_type"]
     }
   }
   ```

3. **Set Webhook URL**:
   - Configure your function webhook endpoint with your unique URL from Settings

   ```
   https://your-project.supabase.co/functions/v1/retell-webhook/[your-user-id]
   ```

4. **Update Agent Prompt**:

   ```
   When the customer needs to provide their email address, physical address,
   or account number, use the collect_info_via_sms function.

   Say: "To make sure I get that exactly right, I'll send you a quick text.
   Just reply with your {info_type} and we'll continue."

   Once you receive the information, confirm it:
   "Perfect, I've got {value}. Let's continue..."
   ```

### 4. Test Your Setup

Use the Test page at `/test` to verify your setup:

1. Navigate to `/test`
2. Enter a test call ID
3. Enter your phone number (E.164 format)
4. Select info type (email, address, or account_number)
5. Customize the message if desired
6. Click "Send Test SMS"
7. Check your phone for SMS
8. Reply with test data
9. Verify in dashboard that request completed

### 5. Monitor Requests

Access the dashboard at `/dashboard` to:

- View your requests (last 100)
- Filter by status (pending, completed, expired, invalid)
- Search by phone number or call ID
- Real-time updates (auto-refresh every 5s)
- Delete requests as needed

## Pages

| Page             | Route               | Description                    |
| ---------------- | ------------------- | ------------------------------ |
| Landing          | `/`                 | Homepage with app introduction |
| Login            | `/login`            | User authentication            |
| Signup           | `/signup`           | User registration              |
| Dashboard        | `/dashboard`        | Monitor information requests   |
| Setup            | `/setup`            | Initial setup wizard           |
| Inbox            | `/inbox`            | View SMS conversations         |
| Test             | `/test`             | Test SMS functionality         |
| Credits          | `/credits`          | Purchase credits for SMS usage |
| Payment Success  | `/payment-success`  | Payment confirmation page      |
| Payment Canceled | `/payment-canceled` | Payment cancellation page      |
| Settings         | `/settings`         | Configure Twilio credentials   |
| Not Found        | `/*`                | 404 error page                 |

## Supabase Functions

### retell-webhook

Main endpoint for Retell AI:

- Receives info requests from voice agent
- Validates user authentication
- Fetches user's Twilio credentials from database
- Creates request in database
- Sends SMS to caller using user's credentials
- Polls for response (up to 5 minutes)
- Returns validated data to AI

### twilio-webhook

SMS response handler:

- Receives incoming SMS from Twilio
- Identifies user by phone number (To field)
- Validates information based on type
- Updates database with result
- Sends confirmation or error SMS using user's credentials

### stripe-webhook

Payment webhook handler:

- Processes Stripe payment events
- Updates user credits on successful payment
- Handles payment failures and refunds

### stripe-checkout

Stripe checkout session handler:

- Creates Stripe checkout sessions
- Redirects users to payment page

### send-sms

SMS sending utility:

- Sends SMS messages using Twilio
- Handles delivery status

### expire-requests

Background cleanup job:

- Finds expired pending requests
- Marks them as expired
- Sends timeout SMS to callers using respective user's credentials

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

## Deployment

### Using Lovable

Simply open [Lovable](https://lovable.dev) and click on Share -> Publish.

### Manual Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Custom Domain

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

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

## Documentation

For detailed integration information, see [INTEGRATION.md](./INTEGRATION.md).

## License

This project is private and proprietary.

## Support

For issues or questions:

- Check function logs in Supabase dashboard
- Review database records in Supabase console
- Test with known valid inputs using the Test page
- Verify Twilio credentials are correctly configured
