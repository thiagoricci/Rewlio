import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";

export default function Test() {
  const [loading, setLoading] = useState(false);
  const [callId, setCallId] = useState("test-" + Date.now());
  const [phoneNumber, setPhoneNumber] = useState("+1");
  const [infoType, setInfoType] = useState("email");
  const [message, setMessage] = useState("Please reply with your email.");
  const [hasCredentials, setHasCredentials] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("user_credentials").select("id").eq("user_id", user.id).maybeSingle();
      setHasCredentials(!!data);
    };
    check();
  }, []);

  const handleTest = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/retell-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          call_id: callId, 
          caller_number: phoneNumber, 
          info_type: infoType, 
          message,
          user_id: session.user.id
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast({ title: "SMS sent!", description: `Request ID: ${data.request_id}` });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background p-8">
        <div className="container max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Test SMS Collection</CardTitle>
              <CardDescription>Send a test SMS request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasCredentials === false && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Configure your Twilio credentials first.{" "}
                    <Link to="/settings" className="text-primary underline">Go to Settings</Link>
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label>Call ID</Label>
                <Input value={callId} onChange={(e) => setCallId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+12345678901" />
              </div>
              <div className="space-y-2">
                <Label>Info Type</Label>
                <Select value={infoType} onValueChange={setInfoType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="address">Address</SelectItem>
                    <SelectItem value="account_number">Account Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Input value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
              <Button onClick={handleTest} disabled={loading || hasCredentials === false} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Test SMS
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
