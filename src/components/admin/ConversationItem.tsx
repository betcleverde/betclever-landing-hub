
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Message } from "@/types/supportTickets";

interface ConversationItemProps {
  userId: string;
  messages: Message[];
  isSelected: boolean;
  isRecent: boolean;
  onSelect: (userId: string) => void;
  onDelete: (userId: string) => void;
}

export const ConversationItem = ({
  userId,
  messages,
  isSelected,
  isRecent,
  onSelect,
  onDelete,
}: ConversationItemProps) => {
  const userEmail = messages[0]?.user_email || 'Unbekannter Benutzer';
  const lastMessage = messages[messages.length - 1];

  return (
    <div
      key={userId}
      className={`p-3 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? "bg-beige text-black"
          : isRecent
            ? "bg-beige/40 text-white border-l-4 border-red-500" 
            : "bg-black/30 text-beige hover:bg-beige/20"
      }`}
      onClick={() => onSelect(userId)}
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
            onDelete(userId);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
