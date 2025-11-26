import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [creditsAdded, setCreditsAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialCredits, setInitialCredits] = useState<number | null>(null);
  const [newCredits, setNewCredits] = useState<number | null>(null);

  useEffect(() => {
    let pollCount = 0;
    const maxPolls = 20; // Poll for up to 20 seconds (20 * 1s)

    // Get initial credit balance
    const getInitialBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setInitialCredits(data.credits);
      }
    };

    getInitialBalance();

    // Poll for credit updates - faster polling (every 1 second)
    const pollInterval = setInterval(async () => {
      pollCount++;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("user_id", user.id)
        .single();

      if (data && initialCredits !== null && data.credits > initialCredits) {
        // Credits have been added!
        setNewCredits(data.credits);
        setCreditsAdded(true);
        setLoading(false);
        clearInterval(pollInterval);
        
        // Auto-redirect to credits page after 1.5 seconds
        setTimeout(() => {
          navigate("/credits?payment_success=true");
        }, 1500);
      } else if (pollCount >= maxPolls) {
        // Timeout - redirect anyway after showing the page
        setLoading(false);
        clearInterval(pollInterval);
        
        // Redirect even on timeout
        setTimeout(() => {
          navigate("/credits?payment_success=true");
        }, 2000);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [initialCredits, navigate]);

  return (
    <>
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {loading ? (
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              ) : (
                <CheckCircle className="h-16 w-16 text-success" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {loading ? "Processing Payment..." : "Payment Successful!"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {loading ? (
              <p className="text-muted-foreground">
                Waiting for credits to be added to your account...
              </p>
            ) : creditsAdded ? (
              <>
                <p className="text-muted-foreground">
                  Your credits have been added successfully! Redirecting to credits page...
                </p>
                {newCredits !== null && initialCredits !== null && (
                  <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Credits Added</p>
                    <p className="text-2xl font-bold text-success">
                      +{newCredits - initialCredits} credits
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      New balance: {newCredits} credits
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">
                Your payment was successful. Redirecting to credits page...
              </p>
            )}
            {sessionId && (
              <p className="text-xs text-muted-foreground">
                Session ID: {sessionId}
              </p>
            )}
            <div className="pt-4">
              <Button 
                onClick={() => navigate("/credits")} 
                className="w-full"
                disabled={loading}
              >
                {loading ? "Processing..." : "Go to Credits Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
