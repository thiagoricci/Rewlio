import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { maskPhoneNumber } from "@/lib/phone-utils";

interface MobileHeaderProps {
  phoneNumber: string;
  onBack: () => void;
}

export function MobileHeader({ phoneNumber, onBack }: MobileHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-card border-b p-4 flex items-center gap-3 lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        className="h-10 w-10"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <h2 className="font-semibold text-lg">{maskPhoneNumber(phoneNumber)}</h2>
    </div>
  );
}
