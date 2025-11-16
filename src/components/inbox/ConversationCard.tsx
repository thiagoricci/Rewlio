import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { maskPhoneNumber } from "@/lib/phone-utils";

interface ConversationCardProps {
  phoneNumber: string;
  latestMessage: string;
  timestamp: string;
  messageCount: number;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: () => void;
}

export function ConversationCard({
  phoneNumber,
  latestMessage,
  timestamp,
  messageCount,
  isSelected,
  onClick,
  onDelete,
}: ConversationCardProps) {
  return (
    <Card
      className={`p-5 cursor-pointer transition-all hover:bg-accent/50 active:scale-[0.98] relative group ${
        isSelected ? "bg-accent" : ""
      }`}
      onClick={onClick}
    >
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
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
