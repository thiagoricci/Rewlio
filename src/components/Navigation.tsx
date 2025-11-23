import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, LogOut, Menu, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchCredits();
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCredits();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setCreditBalance(data.credits);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    }
  };

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
      setSheetOpen(false);
      navigate("/");
    }
  };

  const handleNavClick = () => {
    setSheetOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Rilio</span>
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <>
              <div className="flex space-x-4">
                <Link to="/dashboard">
                  <Button
                    variant={location.pathname === "/dashboard" ? "default" : "ghost"}
                  >
                    Dashboard
                  </Button>
                </Link>
                <Link to="/setup">
                  <Button
                    variant={location.pathname === "/setup" ? "default" : "ghost"}
                  >
                    Setup Guide
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
                <Link to="/credits">
                  <Button
                    variant={location.pathname === "/credits" ? "default" : "ghost"}
                  >
                    Credits
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
              <div className="flex items-center space-x-4">
                {creditBalance !== null && (
                  <Link to="/credits">
                    <Badge 
                      variant={creditBalance <= 10 ? "destructive" : "secondary"}
                      className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <Zap className="h-3 w-3" />
                      {creditBalance}
                    </Badge>
                  </Link>
                )}
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </>
          )}

          {/* Mobile Menu */}
          {isMobile && (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  <Link to="/dashboard" onClick={handleNavClick}>
                    <Button
                      variant={location.pathname === "/dashboard" ? "default" : "ghost"}
                      className="w-full justify-start text-base h-12"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/setup" onClick={handleNavClick}>
                    <Button
                      variant={location.pathname === "/setup" ? "default" : "ghost"}
                      className="w-full justify-start text-base h-12"
                    >
                      Setup Guide
                    </Button>
                  </Link>
                  <Link to="/inbox" onClick={handleNavClick}>
                    <Button
                      variant={location.pathname === "/inbox" ? "default" : "ghost"}
                      className="w-full justify-start text-base h-12"
                    >
                      Inbox
                    </Button>
                  </Link>
                  <Link to="/test" onClick={handleNavClick}>
                    <Button
                      variant={location.pathname === "/test" ? "default" : "ghost"}
                      className="w-full justify-start text-base h-12"
                    >
                      Test
                    </Button>
                  </Link>
                  <Link to="/credits" onClick={handleNavClick}>
                    <Button
                      variant={location.pathname === "/credits" ? "default" : "ghost"}
                      className="w-full justify-start text-base h-12"
                    >
                      Credits
                    </Button>
                  </Link>
                  <Link to="/settings" onClick={handleNavClick}>
                    <Button
                      variant={location.pathname === "/settings" ? "default" : "ghost"}
                      className="w-full justify-start text-base h-12"
                    >
                      Settings
                    </Button>
                  </Link>
                  
                  <div className="border-t pt-4 mt-4">
                    {creditBalance !== null && (
                      <Link to="/credits" onClick={handleNavClick}>
                        <div className="px-3 mb-4 flex items-center gap-2">
                          <Badge 
                            variant={creditBalance <= 10 ? "destructive" : "secondary"}
                            className="flex items-center gap-1"
                          >
                            <Zap className="h-3 w-3" />
                            {creditBalance} credits
                          </Badge>
                        </div>
                      </Link>
                    )}
                    <p className="text-sm text-muted-foreground px-3 mb-4 truncate">
                      {user.email}
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-base h-12" 
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
