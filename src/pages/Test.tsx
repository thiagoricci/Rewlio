import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Info, AlertCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { useCredits } from "@/hooks/use-credits";

export default function Test() {
  const [loading, setLoading] = useState(false);
  const [callId, setCallId] = useState("test-" + Date.now());
  const [phoneNumber, setPhoneNumber] = useState("+1");
  const [message, setMessage] = useState("Please reply with your email.");
  const [hasCredentials, setHasCredentials] = useState<boolean | null>(null);
  const { creditBalance } = useCredits();
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
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Send className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Test SMS</h1>
                <p className="text-sm text-muted-foreground">Send a test SMS request</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle>Send Test SMS</CardTitle>
              <CardDescription>
                Simulate an SMS request to test your Twilio integration
              </CardDescription>
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
              {creditBalance !== undefined && creditBalance !== null && (
                <Alert className={creditBalance <= 10 ? "border-warning bg-warning/10" : ""}>
                  <AlertCircle className={`h-4 w-4 ${creditBalance <= 10 ? "text-warning" : "text-info"}`} />
                  <AlertDescription className={creditBalance <= 10 ? "text-foreground" : ""}>
                    Current balance: <strong>{creditBalance} credits</strong>
                    {creditBalance <= 10 && (
                      <>
                        {" "}- Low balance! <Link to="/credits" className="text-warning hover:underline font-semibold">Purchase more</Link>
                      </>
                    )}
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
                <Label>Message</Label>
                <Input value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
              <Button onClick={handleTest} disabled={loading || hasCredentials === false || (creditBalance !== undefined && creditBalance !== null && creditBalance < 1)} className="w-full">
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
