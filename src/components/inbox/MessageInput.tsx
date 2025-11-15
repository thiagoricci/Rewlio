import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const messageSchema = z.object({
  message: z.string()
    .trim()
    .min(1, { message: "Message cannot be empty" })
    .max(1600, { message: "Message must be less than 1600 characters" }),
});

interface MessageInputProps {
  phoneNumber: string;
  onMessageSent?: () => void;
}

export function MessageInput({ phoneNumber, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    // Validate message
    const validation = messageSchema.safeParse({ message });
    
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: {
          phone_number: phoneNumber,
          message_body: validation.data.message,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Message sent",
          description: "Your message has been sent successfully.",
        });
        setMessage("");
        onMessageSent?.();
      } else {
        throw new Error(data.error || "Failed to send message");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t p-4 bg-card">
      <div className="flex gap-2">
        <Textarea
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSending}
          className="min-h-[44px] max-h-[100px] resize-none"
          maxLength={1600}
        />
        <Button
          onClick={handleSend}
          disabled={isSending || !message.trim()}
          size="icon"
          className="h-[44px] w-[44px] shrink-0"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {message.length}/1600 characters • Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
