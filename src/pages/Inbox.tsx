import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { ConversationCard } from "@/components/inbox/ConversationCard";
import { MessageBubble } from "@/components/inbox/MessageBubble";
import { MobileHeader } from "@/components/inbox/MobileHeader";
import { MessageInput } from "@/components/inbox/MessageInput";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inbox as InboxIcon, MessageSquare } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [showMessages, setShowMessages] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Auto-select first conversation (desktop only)
  useEffect(() => {
    if (conversations.length > 0 && !selectedPhone && !isMobile) {
      setSelectedPhone(conversations[0].phoneNumber);
    }
  }, [conversations, selectedPhone, isMobile]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      // Find the viewport element inside the ScrollArea
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        setTimeout(() => {
          viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      }
    }
  }, [selectedMessages]);

  const handleConversationSelect = (phoneNumber: string) => {
    setSelectedPhone(phoneNumber);
    if (isMobile) {
      setShowMessages(true);
    }
  };

  const handleBackToList = () => {
    setShowMessages(false);
    setSelectedPhone(null);
  };

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("sms_messages")
        .delete()
        .eq("phone_number", conversationToDelete);

      if (error) throw error;

      toast({
        title: "Conversation deleted",
        description: "All messages from this conversation have been removed.",
      });

      // If deleting currently selected conversation, clear selection
      if (selectedPhone === conversationToDelete) {
        setSelectedPhone(null);
        setShowMessages(false);
      }

      refetch();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const handleDeleteClick = (phoneNumber: string) => {
    setConversationToDelete(phoneNumber);
    setDeleteDialogOpen(true);
  };

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
          <>
            {/* Mobile: Show conversations OR messages */}
            {isMobile ? (
              <>
                {/* Conversations List (mobile) */}
                {!showMessages && (
                  <Card className="p-4">
                    <h2 className="font-semibold mb-4">Conversations</h2>
                    <ScrollArea className="h-[calc(100vh-240px)]">
                      <div className="space-y-2">
                        {conversations.map((conversation) => (
                          <ConversationCard
                            key={conversation.phoneNumber}
                            phoneNumber={conversation.phoneNumber}
                            latestMessage={conversation.latestMessage}
                            timestamp={conversation.latestTimestamp}
                            messageCount={conversation.messageCount}
                            isSelected={false}
                            onClick={() => handleConversationSelect(conversation.phoneNumber)}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </Card>
                )}

                {/* Message Thread (mobile) */}
                {showMessages && selectedPhone && (
                  <Card className="p-0 overflow-hidden flex flex-col h-[calc(100vh-180px)]">
                    <MobileHeader 
                      phoneNumber={selectedPhone} 
                      onBack={handleBackToList}
                    />
                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
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
                    <MessageInput 
                      phoneNumber={selectedPhone}
                      onMessageSent={() => refetch()}
                    />
                  </Card>
                )}
              </>
            ) : (
              /* Desktop: Show both panels side by side */
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
                    onClick={() => handleConversationSelect(conversation.phoneNumber)}
                    onDelete={() => handleDeleteClick(conversation.phoneNumber)}
                  />
                        ))}
                      </div>
                    </ScrollArea>
                  </Card>
                </div>

                {/* Message Thread */}
                <div className="lg:col-span-2">
                  <Card className="p-0 overflow-hidden flex flex-col h-[700px]">
                    <div className="border-b p-4">
                      <h2 className="font-semibold">
                        {selectedPhone ? `Conversation with ${selectedPhone}` : "Select a conversation"}
                      </h2>
                    </div>
                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
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
                          {selectedPhone ? "No messages in this conversation" : "Select a conversation to view messages"}
                        </div>
                      )}
                    </ScrollArea>
                    {selectedPhone && (
                      <MessageInput 
                        phoneNumber={selectedPhone}
                        onMessageSent={() => refetch()}
                      />
                    )}
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all messages from {conversationToDelete}? 
              This will permanently remove {conversations.find(c => c.phoneNumber === conversationToDelete)?.messageCount || 0} message(s). 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
