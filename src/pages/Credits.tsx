import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Zap, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  stripe_price_id: string;
}

export default function Credits() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Check for payment success parameter
    if (searchParams.get("payment_success") === "true") {
      toast({
        title: "Payment Successful! 🎉",
        description: "Your credits have been added to your account.",
      });
      // Remove the parameter from URL
      setSearchParams({});
    }

    fetchCredits();
    fetchPackages();

    // Refetch credits when window gains focus (user returns to tab)
    const handleFocus = () => {
      fetchCredits();
    };
    window.addEventListener('focus', handleFocus);

    // Optional: Poll for updates every 30 seconds while on this page
    const pollInterval = setInterval(() => {
      fetchCredits();
    }, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollInterval);
    };
  }, []);

  const fetchCredits = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching credits:", error);
        return;
      }

      setCreditBalance(data.credits);
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchCredits(true);
    toast({
      title: "Refreshing",
      description: "Checking for updated credit balance...",
    });
  };

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from("stripe_products")
      .select("*")
      .order("price_cents", { ascending: true });

    if (error) {
      console.error("Error fetching packages:", error);
      return;
    }

    setPackages(data);
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
      <Navigation />
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
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {creditBalance !== null ? creditBalance : "..."} credits
              </div>
              {creditBalance !== null && creditBalance <= 10 && (
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
