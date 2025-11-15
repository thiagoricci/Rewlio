import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navigation from "@/components/Navigation";
import { isValidE164 } from "@/lib/phone-utils";

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hasCredentials, setHasCredentials] = useState(false);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    setFetching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_credentials")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setAccountSid(data.twilio_account_sid);
        setAuthToken("••••" + data.twilio_auth_token.slice(-4));
        setPhoneNumber(data.twilio_phone_number);
        setHasCredentials(true);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading credentials",
        description: error.message,
      });
    } finally {
      setFetching(false);
    }
  };

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

      setHasCredentials(true);
      await fetchCredentials();
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

  if (fetching) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Twilio Settings</CardTitle>
            <CardDescription>
              Configure your Twilio credentials to send and receive SMS messages
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

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Credentials"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Settings;
