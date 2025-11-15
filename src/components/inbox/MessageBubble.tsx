import { format } from "date-fns";

interface MessageBubbleProps {
  message: string;
  direction: "inbound" | "outbound";
  timestamp: string;
}

export function MessageBubble({ message, direction, timestamp }: MessageBubbleProps) {
  const isInbound = direction === "inbound";

  return (
    <div className={`flex ${isInbound ? "justify-start" : "justify-end"} mb-4`}>
      <div className={`max-w-[70%] flex flex-col ${isInbound ? "items-start" : "items-end"}`}>
        <span className={`text-xs text-muted-foreground mb-1 ${isInbound ? "text-left" : "text-right"}`}>
          {format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a")}
        </span>
        <div
          className={`rounded-lg px-4 py-2 ${
            isInbound
              ? "bg-muted text-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message}</p>
        </div>
      </div>
    </div>
  );
}
