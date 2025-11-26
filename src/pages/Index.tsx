import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, MessageSquare, Shield, Zap, Github, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center border-b">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Rilio</span>
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

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Retell + Twilio</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Rilio
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Enable 2-way messaging with your voice agent. Get real-time human authorization and collect information seamlessly during AI conversations via SMS.
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
                <CardTitle>Human-in-the-Loop</CardTitle>
                <CardDescription>
                  Get instant authorization from humans during AI conversations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="p-2 bg-success/10 rounded-lg w-fit mb-2">
                  <Shield className="h-5 w-5 text-success" />
                </div>
                <CardTitle>Information Collection</CardTitle>
                <CardDescription>
                  Seamlessly collect any information via SMS during voice calls
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

          {/* Side-by-side Use Cases */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-2xl">Use Case 1: Human-in-the-Loop Authorization</CardTitle>
                <CardDescription>
                  Get real-time approval or authorization from humans during AI conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">AI Needs Authorization</h3>
                      <p className="text-muted-foreground text-sm">
                        During a call, your AI agent needs human approval for a decision (e.g., "Can I proceed with this refund?")
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">SMS Sent for Approval</h3>
                      <p className="text-muted-foreground text-sm">
                        System sends an SMS to the designated phone number asking for YES/NO authorization
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Human Responds</h3>
                      <p className="text-muted-foreground text-sm">
                        The human reviews and replies with their decision via SMS
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                      4
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">AI Continues with Authorization</h3>
                      <p className="text-muted-foreground text-sm">
                        The response is returned to the AI, which proceeds or halts based on the human's decision
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-2xl">Use Case 2: Information Collection</CardTitle>
                <CardDescription>
                  Seamlessly collect any information from callers via SMS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-success text-success-foreground rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">AI Needs Information</h3>
                      <p className="text-muted-foreground text-sm">
                        When your AI agent needs specific information (email, address, account number, etc.), it triggers a request
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-success text-success-foreground rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">SMS Sent to Caller</h3>
                      <p className="text-muted-foreground text-sm">
                        System sends an SMS to the caller's phone with a clear prompt for the needed information
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-success text-success-foreground rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Caller Replies</h3>
                      <p className="text-muted-foreground text-sm">
                        Caller texts back their information, which is captured and stored securely
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-success text-success-foreground rounded-full flex items-center justify-center font-bold">
                      4
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">AI Continues with Data</h3>
                      <p className="text-muted-foreground text-sm">
                        The collected information is returned to the AI, which continues the conversation seamlessly
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="font-semibold">Rilio</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Enable 2-way messaging with your voice agent via SMS.
              </p>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h3 className="font-semibold">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/setup" className="text-muted-foreground hover:text-foreground transition-colors">
                    Setup Guide
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/test" className="text-muted-foreground hover:text-foreground transition-colors">
                    Test System
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <h3 className="font-semibold">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    <Github className="h-3 w-3" />
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.twilio.com/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Twilio Docs
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.retellai.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Retell AI Docs
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h3 className="font-semibold">Company</h3>
              <ul className="space-y-2 text-sm">
                {user ? (
                  <>
                    <li>
                      <Link to="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
                        Settings
                      </Link>
                    </li>
                    <li>
                      <Link to="/credits" className="text-muted-foreground hover:text-foreground transition-colors">
                        Credits
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link to="/signup" className="text-muted-foreground hover:text-foreground transition-colors">
                        Sign Up
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <a
                    href="mailto:contact@rilio.app"
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" />
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Rilio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
