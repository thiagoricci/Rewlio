import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { ConversationCard } from "@/components/inbox/ConversationCard";
import { MessageBubble } from "@/components/inbox/MessageBubble";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inbox as InboxIcon, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  phone_number: string;
  message_body: string;
  direction: "inbound" | "outbound";
  created_at: string;
  request_id: string | null;
}

interface Conversation {
  phoneNumber: string;
  messages: Message[];
  latestMessage: string;
  latestTimestamp: string;
  messageCount: number;
}

export default function Inbox() {
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  const { data: messages = [], refetch } = useQuery({
    queryKey: ["sms-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Message[];
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("sms-messages-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sms_messages",
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Group messages by phone number
  const conversations: Conversation[] = Object.values(
    messages.reduce((acc, msg) => {
      if (!acc[msg.phone_number]) {
        acc[msg.phone_number] = {
          phoneNumber: msg.phone_number,
          messages: [],
          latestMessage: msg.message_body,
          latestTimestamp: msg.created_at,
          messageCount: 0,
        };
      }
      acc[msg.phone_number].messages.push(msg);
      acc[msg.phone_number].messageCount++;
      
      // Update latest message if this one is newer
      if (new Date(msg.created_at) > new Date(acc[msg.phone_number].latestTimestamp)) {
        acc[msg.phone_number].latestMessage = msg.message_body;
        acc[msg.phone_number].latestTimestamp = msg.created_at;
      }
      
      return acc;
    }, {} as Record<string, Conversation>)
  ).sort((a, b) => 
    new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime()
  );

  // Get selected conversation messages sorted by date
  const selectedMessages = selectedPhone
    ? conversations.find((c) => c.phoneNumber === selectedPhone)?.messages.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ) || []
    : [];

  // Auto-select first conversation
  useEffect(() => {
    if (conversations.length > 0 && !selectedPhone) {
      setSelectedPhone(conversations[0].phoneNumber);
    }
  }, [conversations, selectedPhone]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <InboxIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Inbox</h1>
          </div>
          <p className="text-muted-foreground">
            View all your SMS conversations in one place
          </p>
        </div>

        {conversations.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No messages yet</h2>
            <p className="text-muted-foreground">
              Your SMS conversations will appear here once you start collecting information
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h2 className="font-semibold mb-4">Conversations</h2>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {conversations.map((conversation) => (
                      <ConversationCard
                        key={conversation.phoneNumber}
                        phoneNumber={conversation.phoneNumber}
                        latestMessage={conversation.latestMessage}
                        timestamp={conversation.latestTimestamp}
                        messageCount={conversation.messageCount}
                        isSelected={selectedPhone === conversation.phoneNumber}
                        onClick={() => setSelectedPhone(conversation.phoneNumber)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>

            {/* Message Thread */}
            <div className="lg:col-span-2">
              <Card className="p-4">
                <div className="border-b pb-4 mb-4">
                  <h2 className="font-semibold">
                    {selectedPhone ? `Conversation with ${selectedPhone}` : "Select a conversation"}
                  </h2>
                </div>
                <ScrollArea className="h-[600px] pr-4">
                  {selectedMessages.length > 0 ? (
                    <div className="space-y-2">
                      {selectedMessages.map((msg) => (
                        <MessageBubble
                          key={msg.id}
                          message={msg.message_body}
                          direction={msg.direction}
                          timestamp={msg.created_at}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No messages in this conversation
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
