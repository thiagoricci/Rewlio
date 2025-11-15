import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, MessageSquare, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center border-b">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">SMS Collector</span>
        </div>
        <div className="flex space-x-4">
          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild>
                <Link to="/settings">Settings</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Retell AI Integration</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            SMS Information Collection
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Seamlessly collect hard-to-spell information from voice calls via SMS. 
            Perfect for email addresses, physical addresses, and account numbers.
          </p>
          <div className="flex gap-4 justify-center">
            {user ? (
              <>
                <Button size="lg" asChild>
                  <Link to="/dashboard">View Dashboard</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/test">Test System</Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link to="/signup">Get Started Free</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <div className="p-2 bg-primary/10 rounded-lg w-fit mb-2">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Real-time SMS</CardTitle>
              <CardDescription>
                Instantly send SMS requests during live calls
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-2 bg-success/10 rounded-lg w-fit mb-2">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <CardTitle>Smart Validation</CardTitle>
              <CardDescription>
                Automatic validation for emails, addresses, and account numbers
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-2 bg-info/10 rounded-lg w-fit mb-2">
                <Database className="h-5 w-5 text-info" />
              </div>
              <CardTitle>Secure Storage</CardTitle>
              <CardDescription>
                All data encrypted and securely stored with RLS policies
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-2 bg-warning/10 rounded-lg w-fit mb-2">
                <MessageSquare className="h-5 w-5 text-warning" />
              </div>
              <CardTitle>Twilio Powered</CardTitle>
              <CardDescription>
                Reliable SMS delivery through Twilio's global network
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-2xl">How It Works</CardTitle>
            <CardDescription>
              Four simple steps to collect information via SMS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Voice AI Triggers Request</h3>
                  <p className="text-muted-foreground text-sm">
                    When your Retell AI agent needs information, it calls the webhook endpoint
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">SMS Sent to Caller</h3>
                  <p className="text-muted-foreground text-sm">
                    System sends an SMS to the caller's phone with instructions and examples
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Caller Replies</h3>
                  <p className="text-muted-foreground text-sm">
                    Caller texts back their information, which is validated automatically
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI Continues Conversation</h3>
                  <p className="text-muted-foreground text-sm">
                    Validated information is returned to the AI, which continues the call seamlessly
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
