
import { Card } from "@/components/ui/card";

export const NoConversationSelected = () => {
  return (
    <Card className="bg-black/50 border border-beige/20 h-[600px] flex items-center justify-center">
      <div className="text-center text-beige/50">
        <p>Keine Konversation ausgewählt</p>
        <p className="text-sm mt-2">Wählen Sie eine Konversation aus der Liste</p>
      </div>
    </Card>
  );
};
