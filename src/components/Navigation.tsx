import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    } else {
      toast({
        title: "Signed out successfully",
      });
      navigate("/");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Meslio</span>
            </Link>
            <div className="flex space-x-4">
              <Link to="/dashboard">
                <Button
                  variant={location.pathname === "/dashboard" ? "default" : "ghost"}
                >
                  Dashboard
                </Button>
              </Link>
              <Link to="/inbox">
                <Button
                  variant={location.pathname === "/inbox" ? "default" : "ghost"}
                >
                  Inbox
                </Button>
              </Link>
              <Link to="/test">
                <Button
                  variant={location.pathname === "/test" ? "default" : "ghost"}
                >
                  Test
                </Button>
              </Link>
              <Link to="/settings">
                <Button
                  variant={location.pathname === "/settings" ? "default" : "ghost"}
                >
                  Settings
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
