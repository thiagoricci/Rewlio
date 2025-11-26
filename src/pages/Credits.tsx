import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Zap, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCredits } from "@/hooks/use-credits";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  stripe_price_id: string;
}

export default function Credits() {
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { creditBalance, isLoading: creditsLoading, invalidateCredits } = useCredits();

  const { data: packages = [] } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stripe_products")
        .select("*")
        .order("price_cents", { ascending: true });

      if (error) throw error;
      return data as CreditPackage[];
    },
  });

  useEffect(() => {
    // Check for payment success parameter
    if (searchParams.get("payment_success") === "true") {
      toast({
        title: "Payment Successful! 🎉",
        description: "Your credits have been added to your account.",
      });
      // Remove the parameter from URL
      setSearchParams({});
      invalidateCredits();
    }
  }, []);

  const handleManualRefresh = () => {
    invalidateCredits();
    toast({
      title: "Refreshing",
      description: "Checking for updated credit balance...",
    });
  };

  const handlePurchase = async (priceId: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background p-8">
        <div className="container max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Credits</h1>
            <p className="text-muted-foreground">
              Manage your SMS credits. Each SMS sent costs 1 credit.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Current Balance
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={creditsLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${creditsLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {creditBalance !== undefined && creditBalance !== null ? creditBalance : "..."} credits
              </div>
              {creditBalance !== undefined && creditBalance !== null && creditBalance <= 10 && (
                <Alert className="mt-4 border-warning bg-warning/10">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-warning">
                    Your credit balance is low. Purchase more credits to continue sending SMS.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle>{pkg.name}</CardTitle>
                  <CardDescription>
                    Get {pkg.credits} SMS credits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-foreground">
                      ${(pkg.price_cents / 100).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">one-time</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${((pkg.price_cents / 100) / pkg.credits).toFixed(4)} per SMS
                  </div>
                  <Button
                    onClick={() => handlePurchase(pkg.stripe_price_id)}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <CreditCard className="mr-2 h-4 w-4" />
                    Purchase Credits
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>All new accounts receive 20 free credits to get started.</p>
            <p className="mt-2">Credits never expire and can be used at any time.</p>
          </div>
        </div>
      </div>
    </>
  );
}
