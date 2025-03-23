import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";
import { Loader2, Trash2, Send, ArrowLeftCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Message, fromSupabase } from "@/types/supportTickets";
import { ButtonBeige } from "@/components/ui/button-beige";
import { useToast } from "@/hooks/use-toast";

const AdminTickets = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [allConversations, setAllConversations] = useState<{ [userId: string]: Message[] }>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [recentUsers, setRecentUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const checkAdminStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setIsAdmin(!!data?.is_admin);
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/login", { replace: true });
    }
  }, [user, isLoading, navigate, isAdmin]);

  useEffect(() => {
    if (user && isAdmin) {
      loadAllConversations();
    }
  }, [user, isAdmin]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadAllConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const groupedMessages = fromSupabase<Message[]>(data).reduce((acc: { [key: string]: Message[] }, message: Message) => {
        const userId = message.user_id;
        if (!acc[userId]) {
          acc[userId] = [];
        }
        acc[userId].push(message);
        return acc;
      }, {});

      setAllConversations(groupedMessages);
      
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const recentUserIds = new Set<string>();
      Object.entries(groupedMessages).forEach(([userId, messages]) => {
        const latestMessage = messages[messages.length - 1];
        if (latestMessage && 
            !latestMessage.is_admin && 
            new Date(latestMessage.created_at) > oneDayAgo) {
          recentUserIds.add(userId);
        }
      });
      
      setRecentUsers(recentUserIds);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('admin_tickets_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_tickets',
      }, (payload) => {
        const newMessage = fromSupabase<Message>(payload.new);
        setAllConversations(prev => {
          const userId = newMessage.user_id;
          return {
            ...prev,
            [userId]: [...(prev[userId] || []), newMessage]
          };
        });
        
        if (!newMessage.is_admin && selectedUserId !== newMessage.user_id) {
          setRecentUsers(prev => {
            const updated = new Set(prev);
            updated.add(newMessage.user_id);
            return updated;
          });
          
          toast({
            title: "Neue Support-Anfrage",
            description: `Neue Nachricht von ${newMessage.user_email || 'einem Benutzer'}`,
          });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, selectedUserId, toast]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId || !user) return;

    setIsLoadingMessage(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: selectedUserId,
          content: newMessage,
          is_admin: true,
          user_email: user.email
        });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoadingMessage(false);
    }
  };

  const handleDeleteConversation = async (userId: string) => {
    if (!confirm("Möchten Sie diese Konversation wirklich löschen?")) return;

    try {
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setAllConversations(prev => {
        const newConversations = { ...prev };
        delete newConversations[userId];
        return newConversations;
      });

      if (selectedUserId === userId) {
        setSelectedUserId(null);
      }
      
      setRecentUsers(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
      
      toast({
        title: "Konversation gelöscht",
        description: "Die Konversation wurde erfolgreich gelöscht."
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Fehler",
        description: "Die Konversation konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-beige animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-beige mb-4">
            Support Tickets
          </h1>
          <p className="text-beige/70">
            Verwalten Sie hier alle Support-Anfragen
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-4">
            <Card className="bg-black/50 border border-beige/20 h-[600px] overflow-hidden flex flex-col">
              <CardHeader>
                <CardTitle className="text-beige">Konversationen</CardTitle>
                <CardDescription className="text-beige/70">
                  {Object.keys(allConversations).length} aktive Gespräche
                  {recentUsers.size > 0 && (
                    <span className="ml-2 text-red-400">
                      ({recentUsers.size} neu)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow overflow-y-auto">
                {Object.keys(allConversations).length === 0 ? (
                  <p className="text-center text-beige/50 py-8">
                    Keine aktiven Gespräche
                  </p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(allConversations).map(([userId, messages]) => {
                      const userEmail = messages[0]?.user_email || 'Unbekannter Benutzer';
                      const lastMessage = messages[messages.length - 1];
                      const isRecent = recentUsers.has(userId);
                      
                      return (
                        <div
                          key={userId}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            selectedUserId === userId
                              ? "bg-beige text-black"
                              : isRecent
                                ? "bg-beige/40 text-white border-l-4 border-red-500" 
                                : "bg-black/30 text-beige hover:bg-beige/20"
                          }`}
                          onClick={() => setSelectedUserId(userId)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium truncate flex items-center">
                                {userEmail}
                                {isRecent && (
                                  <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                    !
                                  </span>
                                )}
                              </p>
                              <p className="text-sm opacity-70 truncate">
                                {lastMessage?.content}
                              </p>
                              <p className="text-xs opacity-50">
                                {new Date(lastMessage?.created_at).toLocaleString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(userId);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-8">
            {selectedUserId ? (
              <>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-beige flex items-center">
                        <button 
                          onClick={() => setSelectedUserId(null)}
                          className="mr-2 md:hidden"
                        >
                          <ArrowLeftCircle className="h-5 w-5 text-beige/70" />
                        </button>
                        {allConversations[selectedUserId][0]?.user_email || 'Benutzer'}
                      </CardTitle>
                      <CardDescription className="text-beige/70">
                        {allConversations[selectedUserId].length} Nachrichten
                      </CardDescription>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteConversation(selectedUserId)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Löschen
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto">
                  <div className="space-y-4">
                    {allConversations[selectedUserId].map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg max-w-[85%] ${
                          msg.is_admin
                            ? "bg-beige text-black ml-auto"
                            : "bg-beige/20 text-beige mr-auto"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </CardContent>
                <div className="p-4 border-t border-beige/20">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <Input
                      placeholder="Ihre Antwort..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="bg-black/30 border-beige/30 text-beige"
                    />
                    <ButtonBeige type="submit" disabled={isLoadingMessage}>
                      <Send

