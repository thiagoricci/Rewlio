import { formatDistanceToNow } from "date-fns";

interface MessageBubbleProps {
  message: string;
  direction: "inbound" | "outbound";
  timestamp: string;
}

export function MessageBubble({ message, direction, timestamp }: MessageBubbleProps) {
  const isInbound = direction === "inbound";

  return (
    <div className={`flex ${isInbound ? "justify-start" : "justify-end"} mb-4`}>
      <div className={`max-w-[70%] ${isInbound ? "items-start" : "items-end"}`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            isInbound
              ? "bg-muted text-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message}</p>
        </div>
        <span className="text-xs text-muted-foreground mt-1 block">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
