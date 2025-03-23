
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Message, fromSupabase } from "@/types/supportTickets";
import { useToast } from "@/hooks/use-toast";
import { ConversationList } from "@/components/admin/ConversationList";
import { ChatInterface } from "@/components/admin/ChatInterface";
import { NoConversationSelected } from "@/components/admin/NoConversationSelected";

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
            <ConversationList
              conversations={allConversations}
              recentUsers={recentUsers}
              selectedUserId={selectedUserId}
              onSelectConversation={setSelectedUserId}
              onDeleteConversation={handleDeleteConversation}
            />
          </div>

          <div className="md:col-span-8">
            {selectedUserId ? (
              <ChatInterface
                userId={selectedUserId}
                messages={allConversations[selectedUserId]}
                newMessage={newMessage}
                isLoadingMessage={isLoadingMessage}
                onMessageChange={setNewMessage}
                onSendMessage={handleSendMessage}
                onDeleteConversation={handleDeleteConversation}
                onBack={() => setSelectedUserId(null)}
              />
            ) : (
              <NoConversationSelected />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTickets;
