
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useNavigate } from 'react-router-dom';
import { Loader2, MessageCircle, User, Search, Trash2, CheckCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { ButtonBeige } from '@/components/ui/button-beige';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  user_id: string;
  content: string;
  is_admin: boolean;
  created_at: string;
  user_email?: string;
}

interface UserTickets {
  user_id: string;
  user_email: string;
  last_message: string;
  last_updated: string;
  unread_count: number;
}

const AdminTickets = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [userTickets, setUserTickets] = useState<UserTickets[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<UserTickets[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && (!user || (user && !isAdmin()))) {
      navigate("/login", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const isAdmin = () => {
    // Check if the user is an admin from the profiles table
    return user?.email === 'admin@betclever.de';
  };

  const fetchUserTickets = async () => {
    setIsLoading(true);
    try {
      // Get unique user_id and most recent message per user
      const { data, error } = await supabase
        .from('support_tickets')
        .select('user_id, user_email, content, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const userMap = new Map<string, UserTickets>();
      
      data?.forEach(message => {
        if (!userMap.has(message.user_id)) {
          userMap.set(message.user_id, {
            user_id: message.user_id,
            user_email: message.user_email || 'Unknown',
            last_message: message.content,
            last_updated: message.created_at,
            unread_count: message.is_admin ? 0 : 1
          });
        }
      });
      
      const tickets = Array.from(userMap.values());
      setUserTickets(tickets);
      setFilteredTickets(tickets);
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      toast({
        title: 'Fehler',
        description: 'Tickets konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setMessages(data || []);
      setSelectedUserId(userId);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Fehler',
        description: 'Nachrichten konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId) return;
    
    setIsSending(true);
    try {
      const selectedUser = userTickets.find(ticket => ticket.user_id === selectedUserId);
      
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: selectedUserId,
          content: newMessage.trim(),
          is_admin: true,
          user_email: selectedUser?.user_email
        });
        
      if (error) throw error;
      
      // Refresh messages
      fetchMessages(selectedUserId);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Fehler',
        description: 'Nachricht konnte nicht gesendet werden.',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredTickets(userTickets);
      return;
    }
    
    const filtered = userTickets.filter(ticket => 
      ticket.user_email.toLowerCase().includes(query.toLowerCase()) ||
      ticket.last_message.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTickets(filtered);
  };

  const handleDeleteChat = async () => {
    if (!selectedUserId) return;
    
    try {
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('user_id', selectedUserId);
        
      if (error) throw error;
      
      toast({
        title: 'Chat gelöscht',
        description: 'Der Chat wurde erfolgreich gelöscht.',
      });
      
      // Refresh tickets and clear messages
      fetchUserTickets();
      setMessages([]);
      setSelectedUserId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: 'Fehler',
        description: 'Chat konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchUserTickets();
    }
  }, [user]);

  useEffect(() => {
    // Subscribe to new messages
    if (!user) return;

    const channel = supabase
      .channel('admin_tickets_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_tickets'
        },
        () => {
          fetchUserTickets();
          if (selectedUserId) {
            fetchMessages(selectedUserId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUserId]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-beige animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin()) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-beige mb-4 animate-fade-in">
            Support Tickets
          </h1>
          <p className="text-beige/70 animate-fade-up animation-delay-200">
            Verwalten Sie hier die Support-Anfragen der Benutzer.
          </p>
        </div>

        <div className="glass-beige p-4 lg:p-8 rounded-xl animate-fade-up animation-delay-400">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-1/3">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-beige/50" />
                  <Input
                    placeholder="Suche nach Benutzern oder Nachrichten..."
                    className="pl-10 bg-background/50 text-beige border-beige/20"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="bg-black/20 border border-beige/10 rounded-lg overflow-hidden h-[550px] overflow-y-auto">
                {isLoading && !selectedUserId ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 text-beige/50 animate-spin" />
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-beige/50 text-center p-4">
                    <MessageCircle className="h-8 w-8 mb-2" />
                    <p>Keine Support-Tickets gefunden</p>
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <div 
                      key={ticket.user_id}
                      className={`border-b border-beige/10 hover:bg-beige/5 transition cursor-pointer ${
                        selectedUserId === ticket.user_id ? 'bg-beige/10' : ''
                      }`}
                      onClick={() => fetchMessages(ticket.user_id)}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-beige/70" />
                            <span className="font-medium text-beige">{ticket.user_email}</span>
                          </div>
                          <span className="text-xs text-beige/50">
                            {formatDistanceToNow(new Date(ticket.last_updated), {
                              addSuffix: true,
                              locale: de
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-beige/70 truncate">{ticket.last_message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="w-full lg:w-2/3">
              {selectedUserId ? (
                <>
                  <div className="bg-black/20 border border-beige/10 rounded-lg overflow-hidden h-[550px] flex flex-col">
                    <div className="border-b border-beige/10 p-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-beige font-medium">
                          {userTickets.find(t => t.user_id === selectedUserId)?.user_email}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteDialogOpen(true)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-6 w-6 text-beige/50 animate-spin" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-beige/50 text-center p-4">
                          <MessageCircle className="h-8 w-8 mb-2" />
                          <p>Keine Nachrichten gefunden</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div 
                            key={message.id} 
                            className={`flex flex-col ${message.is_admin ? 'items-end' : 'items-start'}`}
                          >
                            <div 
                              className={`max-w-[80%] rounded-lg p-3 ${
                                message.is_admin 
                                  ? 'bg-beige text-black' 
                                  : 'bg-beige/10 text-beige'
                              }`}
                            >
                              {message.content}
                            </div>
                            <span className="text-xs text-beige/50 mt-1">
                              {formatDistanceToNow(new Date(message.created_at), {
                                addSuffix: true,
                                locale: de
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="p-4 border-t border-beige/10">
                      <div className="flex items-end gap-2">
                        <Textarea
                          placeholder="Antwort schreiben..."
                          className="min-h-12 bg-background/50 text-beige border-beige/20 resize-none"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button 
                          className="bg-beige hover:bg-beige/80 text-black"
                          size="icon"
                          onClick={handleSendMessage}
                          disabled={isSending || !newMessage.trim()}
                        >
                          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <Card className="h-[550px] border-beige/10 bg-black/20">
                  <div className="flex flex-col items-center justify-center h-full text-beige/50 text-center p-6">
                    <MessageCircle className="h-12 w-12 mb-4" />
                    <h3 className="text-xl font-medium mb-2">Support-Nachrichten</h3>
                    <p>Wählen Sie einen Benutzer aus der Liste auf der linken Seite aus, um die Konversation anzuzeigen.</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-background border-beige/20">
          <DialogHeader>
            <DialogTitle className="text-beige">Chat löschen</DialogTitle>
            <DialogDescription>
              Möchten Sie diesen Chat wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteChat}
            >
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTickets;
