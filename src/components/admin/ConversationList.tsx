
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Message } from "@/types/supportTickets";
import { ConversationItem } from "./ConversationItem";

interface ConversationListProps {
  conversations: { [userId: string]: Message[] };
  recentUsers: Set<string>;
  selectedUserId: string | null;
  onSelectConversation: (userId: string) => void;
  onDeleteConversation: (userId: string) => void;
}

export const ConversationList = ({
  conversations,
  recentUsers,
  selectedUserId,
  onSelectConversation,
  onDeleteConversation,
}: ConversationListProps) => {
  return (
    <Card className="bg-black/50 border border-beige/20 h-[600px] overflow-hidden flex flex-col">
      <CardHeader>
        <CardTitle className="text-beige">Konversationen</CardTitle>
        <CardDescription className="text-beige/70">
          {Object.keys(conversations).length} aktive Gespräche
          {recentUsers.size > 0 && (
            <span className="ml-2 text-red-400">
              ({recentUsers.size} neu)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        {Object.keys(conversations).length === 0 ? (
          <p className="text-center text-beige/50 py-8">
            Keine aktiven Gespräche
          </p>
        ) : (
          <div className="space-y-2">
            {Object.entries(conversations).map(([userId, messages]) => (
              <ConversationItem
                key={userId}
                userId={userId}
                messages={messages}
                isSelected={selectedUserId === userId}
                isRecent={recentUsers.has(userId)}
                onSelect={onSelectConversation}
                onDelete={onDeleteConversation}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
