
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteApplicationButtonProps {
  applicationId: string;
  userName: string;
  onDelete: () => void;
}

const DeleteApplicationButton = ({ 
  applicationId, 
  userName, 
  onDelete 
}: DeleteApplicationButtonProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('tippgemeinschaft_applications')
        .delete()
        .eq('id', applicationId);

      if (error) throw error;
      
      toast({
        title: "Antrag gelöscht",
        description: `Der Antrag von ${userName} wurde erfolgreich gelöscht.`,
      });
      
      onDelete();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: "Fehler",
        description: "Der Antrag konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-red-500">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-card border border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-beige">Antrag löschen</AlertDialogTitle>
          <AlertDialogDescription className="text-beige/70">
            Sind Sie sicher, dass Sie den Antrag von {userName} löschen möchten? 
            Diese Aktion kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-card text-beige/70 hover:bg-card/80 hover:text-beige">
            Abbrechen
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            {isDeleting ? "Wird gelöscht..." : "Löschen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteApplicationButton;
