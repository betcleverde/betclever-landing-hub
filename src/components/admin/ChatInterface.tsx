
import { useRef } from "react";
import { ArrowLeftCircle, Send, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonBeige } from "@/components/ui/button-beige";
import { Input } from "@/components/ui/input";
import { Message } from "@/types/supportTickets";

interface ChatInterfaceProps {
  userId: string;
  messages: Message[];
  newMessage: string;
  isLoadingMessage: boolean;
  onMessageChange: (message: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onDeleteConversation: (userId: string) => void;
  onBack: () => void;
}

export const ChatInterface = ({
  userId,
  messages,
  newMessage,
  isLoadingMessage,
  onMessageChange,
  onSendMessage,
  onDeleteConversation,
  onBack,
}: ChatInterfaceProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Card className="bg-black/50 border border-beige/20 h-[600px] overflow-hidden flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-beige flex items-center">
              <button 
                onClick={onBack}
                className="mr-2 md:hidden"
              >
                <ArrowLeftCircle className="h-5 w-5 text-beige/70" />
              </button>
              {messages[0]?.user_email || 'Benutzer'}
            </CardTitle>
            <CardDescription className="text-beige/70">
              {messages.length} Nachrichten
            </CardDescription>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteConversation(userId)}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Löschen
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => (
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
        <form onSubmit={onSendMessage} className="flex space-x-2">
          <Input
            placeholder="Ihre Antwort..."
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            className="bg-black/30 border-beige/30 text-beige"
          />
          <ButtonBeige type="submit" disabled={isLoadingMessage}>
            <Send className="h-4 w-4 mr-1" /> 
            Senden
          </ButtonBeige>
        </form>
      </div>
    </Card>
  );
};
