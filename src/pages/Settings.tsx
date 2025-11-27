import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserCredentials } from "@/hooks/use-user-credentials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Info, Copy, Check, Trash2, Settings as SettingsIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isValidE164 } from "@/lib/phone-utils";

const Settings = () => {
  const { toast } = useToast();
  const { credentials, isLoading: fetching, invalidateCredentials } = useUserCredentials();
  const [loading, setLoading] = useState(false);
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasCredentials = !!credentials;
  const userId = credentials?.user_id;

  useEffect(() => {
    if (credentials) {
      setAccountSid(credentials.twilio_account_sid);
      setAuthToken("••••" + credentials.twilio_auth_token.slice(-4));
      setPhoneNumber(credentials.twilio_phone_number);
    } else {
      setAccountSid("");
      setAuthToken("");
      setPhoneNumber("");
    }
  }, [credentials]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidE164(phoneNumber)) {
      toast({
        variant: "destructive",
        title: "Invalid phone number",
        description: "Phone number must be in E.164 format (e.g., +12345678901)",
      });
      return;
    }

    if (authToken.startsWith("••••")) {
      toast({
        variant: "destructive",
        title: "Update auth token",
        description: "Please enter your full Twilio Auth Token to update credentials",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const credentials = {
        user_id: user.id,
        twilio_account_sid: accountSid,
        twilio_auth_token: authToken,
        twilio_phone_number: phoneNumber,
      };

      const { error } = await supabase
        .from("user_credentials")
        .upsert(credentials, { onConflict: "user_id" });

      if (error) throw error;

      toast({
        title: "Credentials saved",
        description: "Your Twilio credentials have been saved successfully",
      });

      await invalidateCredentials();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving credentials",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyWebhookUrl = async () => {
    const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/retell-webhook/${userId}`;
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Webhook URL copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveCredentials = async () => {
    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_credentials")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      // Clear form fields
      setAccountSid("");
      setAuthToken("");
      setPhoneNumber("");
      setShowDeleteDialog(false);
      
      await invalidateCredentials();

      toast({
        title: "Credentials removed",
        description: "Your Twilio credentials have been removed successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error removing credentials",
        description: error.message,
      });
    } finally {
      setDeleting(false);
    }
  };

  if (fetching) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <SettingsIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-sm text-muted-foreground">Configure your Twilio credentials to send and receive SMS messages</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 flex flex-col items-center">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle>Twilio Settings</CardTitle>
              <CardDescription>
                Enter your Twilio credentials to enable SMS functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!hasCredentials && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You need to configure your Twilio credentials before you can use the SMS collection system.
                    Find these credentials in your{" "}
                    <a
                      href="https://console.twilio.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Twilio Console
                    </a>
                    .
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountSid">Account SID</Label>
                  <Input
                    id="accountSid"
                    type="text"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={accountSid}
                    onChange={(e) => setAccountSid(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Find this in your Twilio Console dashboard
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authToken">Auth Token</Label>
                  <Input
                    id="authToken"
                    type="password"
                    placeholder="Your Twilio Auth Token"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Found under "Account Info" in your Twilio Console
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Twilio Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+12345678901"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be in E.164 format (e.g., +12345678901)
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Credentials"
                    )}
                  </Button>
                  
                  {hasCredentials && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={loading || deleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {hasCredentials && (
            <Card className="max-w-2xl w-full mt-6">
              <CardHeader>
                <CardTitle>Retell AI Webhook Configuration</CardTitle>
                <CardDescription>
                  Use this webhook URL in your Retell AI agent settings to enable SMS collection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="webhook-url"
                        value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/retell-webhook/${userId}`}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={copyWebhookUrl}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Configure this URL in your Retell AI agent's function settings. This URL is unique to your account and uses your configured Twilio credentials.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Twilio Credentials?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your saved Twilio credentials. You'll need to reconfigure them to use the SMS collection system again.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveCredentials}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Credentials"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Settings;
