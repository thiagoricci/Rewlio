import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: string;
  direction: "inbound" | "outbound";
  timestamp: string;
}

export function MessageBubble({ message, direction, timestamp }: MessageBubbleProps) {
  const isInbound = direction === "inbound";

  return (
    <div className={cn("flex w-full mb-4", isInbound ? "justify-start" : "justify-end")}>
      <div className={cn("flex flex-col max-w-[75%]", isInbound ? "items-start" : "items-end")}>
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
            isInbound
              ? "bg-secondary text-secondary-foreground rounded-tl-none"
              : "bg-primary text-primary-foreground rounded-tr-none"
          )}
        >
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message}</p>
        </div>
        <span className="text-[10px] text-muted-foreground mt-1 px-1">
          {format(new Date(timestamp), "h:mm a")}
        </span>
      </div>
    </div>
  );
}
