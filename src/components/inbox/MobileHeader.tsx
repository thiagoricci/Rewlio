import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MobileHeaderProps {
  phoneNumber: string;
  onBack: () => void;
}

export function MobileHeader({ phoneNumber, onBack }: MobileHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-3 flex items-center gap-3 lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        className="h-9 w-9 -ml-2"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 border">
          <AvatarFallback className="bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <h2 className="font-semibold text-sm">{phoneNumber}</h2>
      </div>
    </div>
  );
}
