import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ConversationCard } from "@/components/inbox/ConversationCard";
import { MessageBubble } from "@/components/inbox/MessageBubble";
import { MobileHeader } from "@/components/inbox/MobileHeader";
import { MessageInput } from "@/components/inbox/MessageInput";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inbox as InboxIcon, MessageSquare, User } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
    <div className="h-[calc(100vh-4rem)] bg-background p-4 md:p-6 overflow-hidden">
      <div className="h-full max-w-7xl mx-auto flex flex-col">
        <div className="mb-6 flex-shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <InboxIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Manage your SMS conversations
          </p>
        </div>

        {conversations.length === 0 ? (
          <Card className="flex-1 flex flex-col items-center justify-center p-12 text-center border-dashed">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No messages yet</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Your SMS conversations will appear here once you start collecting information from your users.
            </p>
          </Card>
        ) : (
          <div className="flex-1 flex overflow-hidden rounded-xl border bg-card shadow-sm">
            {/* Mobile: Show conversations OR messages */}
            {isMobile ? (
              <>
                {/* Conversations List (mobile) */}
                {!showMessages && (
                  <div className="w-full flex flex-col h-full">
                    <div className="p-4 border-b bg-muted/30">
                      <h2 className="font-semibold">Conversations</h2>
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="divide-y">
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
                  </div>
                )}

                {/* Message Thread (mobile) */}
                {showMessages && selectedPhone && (
                  <div className="w-full flex flex-col h-full bg-background">
                    <MobileHeader
                      phoneNumber={selectedPhone}
                      onBack={handleBackToList}
                    />
                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                      {selectedMessages.length > 0 ? (
                        <div className="space-y-4">
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
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                          <p>No messages in this conversation</p>
                        </div>
                      )}
                    </ScrollArea>
                    <MessageInput
                      phoneNumber={selectedPhone}
                      onMessageSent={() => refetch()}
                    />
                  </div>
                )}
              </>
            ) : (
              /* Desktop: Show both panels side by side */
              <>
                {/* Conversations List */}
                <div className="w-80 border-r flex flex-col bg-muted/10">
                  <div className="p-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                    <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Conversations</h2>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="divide-y">
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
                </div>

                {/* Message Thread */}
                <div className="flex-1 flex flex-col bg-background min-w-0">
                  {selectedPhone ? (
                    <>
                      <div className="h-14 border-b flex items-center px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h2 className="font-semibold text-sm">{selectedPhone}</h2>
                          </div>
                        </div>
                      </div>
                      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                        {selectedMessages.length > 0 ? (
                          <div className="space-y-1">
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
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <p>No messages in this conversation</p>
                          </div>
                        )}
                      </ScrollArea>
                      <MessageInput
                        phoneNumber={selectedPhone}
                        onMessageSent={() => refetch()}
                      />
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium">Select a conversation</p>
                      <p className="text-sm text-muted-foreground/80 mt-1">Choose a contact to view message history</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

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
