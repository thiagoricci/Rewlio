import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Test() {
  const [loading, setLoading] = useState(false);
  const [callId, setCallId] = useState("test-call-" + Date.now());
  const [phoneNumber, setPhoneNumber] = useState("+1");
  const [infoType, setInfoType] = useState("email");
  const { toast } = useToast();

  const handleTest = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/retell-webhook`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            call_id: callId,
            caller_number: phoneNumber,
            info_type: infoType
          })
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Request sent successfully!",
          description: `Request ID: ${data.request_id}. Check your phone for SMS.`,
        });
      } else {
        toast({
          title: "Error sending request",
          description: data.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: String(error),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Test SMS Collection</CardTitle>
            <CardDescription>
              Send a test SMS request to your phone number
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="call-id">Call ID</Label>
              <Input
                id="call-id"
                value={callId}
                onChange={(e) => setCallId(e.target.value)}
                placeholder="test-call-123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (E.164 format)</Label>
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+12345678901"
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +1 for US)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="info-type">Information Type</Label>
              <Select value={infoType} onValueChange={setInfoType}>
                <SelectTrigger id="info-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email Address</SelectItem>
                  <SelectItem value="address">Physical Address</SelectItem>
                  <SelectItem value="account_number">Account Number</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleTest}
              disabled={loading || !phoneNumber || phoneNumber.length < 5}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Test SMS
            </Button>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Test Flow:</h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Enter your phone number above</li>
                <li>Click "Send Test SMS"</li>
                <li>Check your phone for the SMS</li>
                <li>Reply with test data (e.g., test@example.com)</li>
                <li>View the request in the Dashboard</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
