import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, Info, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const Setup = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>("");
  const [hasCredentials, setHasCredentials] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Check if user has credentials
        const { data } = await supabase
          .from('user_credentials')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        setHasCredentials(!!data);
      }
    };
    fetchUserData();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const twilioWebhookUrl = "https://kqzsgqqwnthclrlcfkgs.supabase.co/functions/v1/twilio-webhook";
  const retellWebhookUrl = userId 
    ? `https://kqzsgqqwnthclrlcfkgs.supabase.co/functions/v1/retell-webhook`
    : "Save your Twilio credentials first to generate your unique URL";

  const retellFunctionJson = `{
            "name": "contact_human",
            "description": "Send SMS to collect information or contact the human caller",
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
}`;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Setup Guide</h1>
          <p className="text-muted-foreground">
            Follow these steps to configure your Meslio account and start collecting information via SMS
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="twilio">Twilio Setup</TabsTrigger>
            <TabsTrigger value="retell">Retell AI</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What is Meslio?</CardTitle>
                <CardDescription>
                  Meslio enables Retell AI voice agents to collect hard-to-spell information via SMS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground">
                  When your AI voice agent needs to collect information like email addresses, 
                  physical addresses, or account numbers, Meslio seamlessly sends an SMS to your caller, 
                  receives their response, validates it, and returns the information to your agent.
                </p>

                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">How It Works:</h3>
                  <ol className="space-y-2 list-decimal list-inside text-foreground">
                    <li>Your Retell AI agent calls the Meslio webhook function</li>
                    <li>Meslio sends an SMS to the caller via your Twilio account</li>
                    <li>The caller receives the SMS and replies with their information</li>
                    <li>Meslio validates the response and returns it to your Retell AI agent</li>
                    <li>Your agent continues the conversation with the collected information</li>
                  </ol>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Prerequisites:</strong> You'll need a Twilio account with an SMS-enabled 
                    phone number and a Retell AI account to use Meslio.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2 pt-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Setup Checklist
                  </h3>
                  <ul className="space-y-2 ml-7">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Meslio account created</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${hasCredentials ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span>Twilio credentials configured</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span>Retell AI function configured</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Twilio Setup Tab */}
          <TabsContent value="twilio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Get Twilio Credentials</CardTitle>
                <CardDescription>Create a Twilio account and gather your credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-4 list-decimal list-inside">
                  <li className="space-y-2">
                    <span className="font-semibold">Sign up for Twilio</span>
                    <p className="text-sm text-muted-foreground ml-6">
                      Visit <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                        twilio.com/try-twilio <ExternalLink className="h-3 w-3" />
                      </a> and create an account
                    </p>
                  </li>
                  <li className="space-y-2">
                    <span className="font-semibold">Find your Account SID</span>
                    <p className="text-sm text-muted-foreground ml-6">
                      Navigate to the Twilio Console Dashboard. Your Account SID is displayed in the project info section.
                    </p>
                  </li>
                  <li className="space-y-2">
                    <span className="font-semibold">Find your Auth Token</span>
                    <p className="text-sm text-muted-foreground ml-6">
                      On the same page, click "View" next to the Auth Token to reveal it.
                    </p>
                  </li>
                  <li className="space-y-2">
                    <span className="font-semibold">Get an SMS-capable phone number</span>
                    <p className="text-sm text-muted-foreground ml-6">
                      Go to Phone Numbers → Buy a Number, and purchase an SMS-enabled phone number.
                    </p>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 2: Configure Credentials in Meslio</CardTitle>
                <CardDescription>Save your Twilio credentials in Settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-4 list-decimal list-inside">
                  <li className="space-y-2">
                    <span className="font-semibold">Navigate to Settings</span>
                    <p className="text-sm text-muted-foreground ml-6">
                      <Link to="/settings" className="text-primary hover:underline">
                        Go to Settings page
                      </Link> and enter your Twilio credentials
                    </p>
                  </li>
                  <li className="space-y-2">
                    <span className="font-semibold">Phone Number Format</span>
                    <p className="text-sm text-muted-foreground ml-6">
                      Enter your phone number in E.164 format: <code className="bg-muted px-2 py-1 rounded">+12345678901</code>
                    </p>
                  </li>
                  <li className="space-y-2">
                    <span className="font-semibold">Save Configuration</span>
                    <p className="text-sm text-muted-foreground ml-6">
                      Click "Save Configuration" to store your credentials securely
                    </p>
                  </li>
                </ol>

                {!hasCredentials && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      You haven't configured your Twilio credentials yet. 
                      <Link to="/settings" className="text-primary hover:underline ml-1">
                        Configure them now
                      </Link>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 3: Configure Twilio Webhook</CardTitle>
                <CardDescription>Set up Twilio to forward SMS replies to Meslio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This webhook receives SMS replies from your customers and processes them
                  </AlertDescription>
                </Alert>

                <ol className="space-y-4 list-decimal list-inside">
                  <li className="space-y-2">
                    <span className="font-semibold">Copy your Twilio Webhook URL</span>
                    <div className="ml-6 mt-2">
                      <div className="bg-muted p-3 rounded-lg font-mono text-sm break-all">
                        {twilioWebhookUrl}
                      </div>
                      <Button
                        onClick={() => copyToClipboard(twilioWebhookUrl, "Twilio webhook URL")}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy URL
                      </Button>
                    </div>
                  </li>
                  <li className="space-y-2">
                    <span className="font-semibold">Configure in Twilio Console</span>
                    <ul className="text-sm text-muted-foreground ml-6 space-y-1">
                      <li>• Go to Twilio Console → Phone Numbers → Manage → Active Numbers</li>
                      <li>• Click on your SMS-enabled phone number</li>
                      <li>• Scroll to "Messaging Configuration"</li>
                      <li>• Under "A MESSAGE COMES IN", paste the webhook URL</li>
                      <li>• Set the method to <code className="bg-muted px-2 py-1 rounded">POST</code></li>
                      <li>• Click "Save"</li>
                    </ul>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Retell AI Tab */}
          <TabsContent value="retell" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Get Your Retell Webhook URL</CardTitle>
                <CardDescription>This URL is unique to your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasCredentials ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Your unique webhook URL is generated automatically after saving Twilio credentials. 
                      This URL uses your Twilio configuration to send SMS messages.
                    </p>
                    <div className="bg-muted p-3 rounded-lg font-mono text-sm break-all">
                      {retellWebhookUrl}
                    </div>
                    <Button
                      onClick={() => copyToClipboard(retellWebhookUrl, "Retell webhook URL")}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy URL
                    </Button>
                  </>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Please configure your Twilio credentials first to generate your unique webhook URL.
                      <Link to="/settings" className="text-primary hover:underline ml-1">
                        Go to Settings
                      </Link>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 2: Create Custom Function in Retell AI</CardTitle>
                <CardDescription>Add the SMS collection function to your Retell agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-4 list-decimal list-inside">
                  <li className="space-y-2">
                    <span className="font-semibold">Navigate to Functions</span>
                    <p className="text-sm text-muted-foreground ml-6">
                      In your Retell Dashboard, go to Tools → Create Tool
                    </p>
                  </li>
                  <li className="space-y-2">
                    <span className="font-semibold">Copy the function definition</span>
                    <div className="ml-6 mt-2">
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                        <code>{retellFunctionJson}</code>
                      </pre>
                      <Button
                        onClick={() => copyToClipboard(retellFunctionJson, "Function JSON")}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy JSON
                      </Button>
                    </div>
                  </li>
                  <li className="space-y-2">
                    <span className="font-semibold">Configure the function</span>
                    <div className="ml-6 space-y-2 text-sm text-muted-foreground">
                      <p><strong>Name:</strong> Must be exactly <code className="bg-muted px-2 py-1 rounded">contact_human</code></p>
                      <p><strong>message parameter:</strong> The SMS text your caller will receive</p>
                      <p><strong>info_type parameter:</strong> Choose from "email", "address", or "account_number"</p>
                    </div>
                  </li>
                </ol>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    The function name must be exactly <code className="bg-muted px-2 py-1 rounded">contact_human</code> for the webhook to work correctly
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 3: Set Function Webhook URL</CardTitle>
                <CardDescription>Connect the function to Meslio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasCredentials ? (
                  <ol className="space-y-4 list-decimal list-inside">
                    <li className="space-y-2">
                      <span className="font-semibold">In the function settings</span>
                      <p className="text-sm text-muted-foreground ml-6">
                        Paste your unique webhook URL in the "Webhook URL" field
                      </p>
                    </li>
                    <li className="space-y-2">
                      <span className="font-semibold">Set method to POST</span>
                      <p className="text-sm text-muted-foreground ml-6">
                        Ensure the HTTP method is set to POST
                      </p>
                    </li>
                    <li className="space-y-2">
                      <span className="font-semibold">Save the function</span>
                    </li>
                  </ol>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Configure your Twilio credentials first to get your webhook URL
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 4: Update Agent Prompt (Recommended)</CardTitle>
                <CardDescription>Teach your agent when to use the SMS function</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add instructions to your agent's system prompt so it knows when to use the SMS collection function:
                </p>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`When you need to collect email addresses, physical addresses, 
or account numbers, use the contact_human function.

Examples:
- "I'll text you so you can type your email address"
  Then call: contact_human with 
  message="Please reply with your email address" 
  and info_type="email"

- "Let me send you a text for your mailing address"
  Then call: contact_human with 
  message="Please reply with your full mailing address" 
  and info_type="address"`}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Your Setup</CardTitle>
                <CardDescription>Verify everything is working correctly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Use the built-in Test page to simulate the entire flow without making a phone call
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Using the Test Page:</h3>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li>Navigate to the <Link to="/test" className="text-primary hover:underline">Test page</Link></li>
                      <li>Enter a phone number (your own for testing)</li>
                      <li>Type a message (e.g., "Please reply with your email address")</li>
                      <li>Select an info type (email, address, or account_number)</li>
                      <li>Click "Send Test Request"</li>
                      <li>You should receive an SMS on the phone number you entered</li>
                      <li>Reply to the SMS with test data</li>
                      <li>Check the Dashboard to see the response</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Expected Flow:</h3>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li>SMS sent to the specified phone number</li>
                      <li>User receives the SMS</li>
                      <li>User replies with the requested information</li>
                      <li>Response appears in your Inbox</li>
                      <li>Status changes to "Completed" in Dashboard</li>
                    </ol>
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <h3 className="font-semibold">Common Issues & Solutions:</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-foreground">Issue: SMS not received</p>
                      <ul className="text-muted-foreground ml-4 mt-1 space-y-1">
                        <li>• Verify phone number is in E.164 format (+12345678901)</li>
                        <li>• Check Twilio account has sufficient credits</li>
                        <li>• Confirm Twilio phone number is SMS-capable</li>
                        <li>• Check Twilio logs for delivery status</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium text-foreground">Issue: Webhook error in Retell AI</p>
                      <ul className="text-muted-foreground ml-4 mt-1 space-y-1">
                        <li>• Verify Twilio credentials are correct in Settings</li>
                        <li>• Ensure webhook URL is copied correctly</li>
                        <li>• Check function name is exactly "collect_info_via_sms"</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium text-foreground">Issue: Invalid response status</p>
                      <ul className="text-muted-foreground ml-4 mt-1 space-y-1">
                        <li>• Verify info_type matches the response format</li>
                        <li>• Email must be valid email format</li>
                        <li>• Account number must be alphanumeric</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium text-foreground">Issue: No response received</p>
                      <ul className="text-muted-foreground ml-4 mt-1 space-y-1">
                        <li>• Check Twilio webhook is configured correctly</li>
                        <li>• Verify webhook URL points to twilio-webhook function</li>
                        <li>• Requests expire after 5 minutes - reply promptly</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button asChild>
                    <Link to="/test">
                      Go to Test Page
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/dashboard">
                      View Dashboard
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>If you continue to experience issues:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Check the Dashboard for error messages</li>
                  <li>Review the Inbox to see SMS conversation history</li>
                  <li>Verify all webhook URLs are configured correctly</li>
                  <li>Test with the Test page before using with real Retell calls</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Setup;
