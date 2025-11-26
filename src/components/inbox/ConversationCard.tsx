import { formatDistanceToNow } from "date-fns";
import { Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
    <div
      className={`p-4 cursor-pointer transition-colors hover:bg-accent/50 relative group border-b last:border-b-0 ${
        isSelected ? "bg-accent" : ""
      }`}
      onClick={onClick}
    >
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 border">
          <AvatarFallback className="bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1 pr-6">
            <p className="font-medium text-sm text-foreground truncate">
              {phoneNumber}
            </p>
            <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
              {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate line-clamp-1 pr-2">{latestMessage}</p>
        </div>
      </div>
    </div>
  );
}
