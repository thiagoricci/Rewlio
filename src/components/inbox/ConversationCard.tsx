import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { maskPhoneNumber } from "@/lib/phone-utils";

interface ConversationCardProps {
  phoneNumber: string;
  latestMessage: string;
  timestamp: string;
  messageCount: number;
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationCard({
  phoneNumber,
  latestMessage,
  timestamp,
  messageCount,
  isSelected,
  onClick,
}: ConversationCardProps) {
  return (
    <Card
      className={`p-5 cursor-pointer transition-all hover:bg-accent/50 active:scale-[0.98] ${
        isSelected ? "bg-accent" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-base truncate">
              {phoneNumber}
            </p>
            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
              {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">{latestMessage}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">
              {messageCount} {messageCount === 1 ? "message" : "messages"}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
