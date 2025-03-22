
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ButtonBeige } from "./ui/button-beige";
import { Message, fromSupabase } from "@/types/supportTickets";

const SupportChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(fromSupabase<Message[]>(data));
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('support_tickets_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_tickets',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setMessages((current) => [...current, fromSupabase<Message>(payload.new)]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          content: message,
          is_admin: false,
          user_email: user.email
        });

      if (error) throw error;
      setMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {isOpen ? (
        <Card className="fixed bottom-24 right-6 w-80 md:w-96 z-50 bg-black/80 border border-beige/30 shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-beige text-lg">Support Chat</CardTitle>
              <Button variant="ghost" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0 text-beige/70 hover:text-beige hover:bg-transparent">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-80 overflow-y-auto">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-center text-beige/50 py-8">
                  Noch keine Nachrichten. Stellen Sie Ihre Frage!
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg max-w-[85%] ${
                      msg.is_admin
                        ? "bg-beige/20 text-beige ml-auto"
                        : "bg-beige text-black mr-auto"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
          <CardFooter>
            <form onSubmit={handleSendMessage} className="w-full flex space-x-2">
              <Input
                placeholder="Ihre Nachricht..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-black/50 border-beige/30 text-beige"
              />
              <ButtonBeige type="submit" size="icon" disabled={isLoading}>
                <Send className="h-4 w-4" />
              </ButtonBeige>
            </form>
          </CardFooter>
        </Card>
      ) : (
        <ButtonBeige
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 rounded-full w-12 h-12 p-0 z-50"
        >
          <MessageCircle className="h-6 w-6" />
        </ButtonBeige>
      )}
    </>
  );
};

export default SupportChat;
