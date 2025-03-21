
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";
import { Loader2, Search, ArrowLeft, UserCog, Mail, Key } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { ButtonBeige } from "@/components/ui/button-beige";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const AdminUsers = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"email" | "password">("email");
  const [newValue, setNewValue] = useState("");
  
  // Check if user is admin
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  
  // Fetch all users
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;
      
      // Fetch profiles to check admin status
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) throw profilesError;
      
      // Merge auth users with profiles
      const mergedUsers = authUsers.users.map(authUser => {
        const userProfile = profiles.find(p => p.id === authUser.id);
        return {
          ...authUser,
          is_admin: userProfile?.is_admin || false
        };
      });
      
      return mergedUsers;
    },
    enabled: !!user && !!profile?.is_admin,
  });
  
  // Update user email
  const updateEmailMutation = useMutation({
    mutationFn: async ({ userId, email }: { userId: string, email: string }) => {
      const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { email }
      );
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "E-Mail aktualisiert",
        description: "Die E-Mail-Adresse wurde erfolgreich aktualisiert.",
        duration: 3000,
      });
      setDialogOpen(false);
      refetchUsers();
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: error.message || "E-Mail konnte nicht aktualisiert werden.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });
  
  // Update user password
  const updatePasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string, password: string }) => {
      const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { password }
      );
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Passwort aktualisiert",
        description: "Das Passwort wurde erfolgreich aktualisiert.",
        duration: 3000,
      });
      setDialogOpen(false);
      refetchUsers();
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: error.message || "Passwort konnte nicht aktualisiert werden.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });
  
  // Toggle admin status
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string, isAdmin: boolean }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_admin: isAdmin })
        .eq('id', userId)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Status aktualisiert",
        description: "Der Admin-Status wurde erfolgreich aktualisiert.",
        duration: 3000,
      });
      refetchUsers();
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: error.message || "Status konnte nicht aktualisiert werden.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });
  
  // Open dialog for email update
  const openEmailDialog = (user: any) => {
    setSelectedUser(user);
    setDialogType("email");
    setNewValue(user.email || "");
    setDialogOpen(true);
  };
  
  // Open dialog for password update
  const openPasswordDialog = (user: any) => {
    setSelectedUser(user);
    setDialogType("password");
    setNewValue("");
    setDialogOpen(true);
  };
  
  // Handle dialog submit
  const handleDialogSubmit = () => {
    if (!selectedUser) return;
    
    if (dialogType === "email") {
      updateEmailMutation.mutate({ userId: selectedUser.id, email: newValue });
    } else {
      updatePasswordMutation.mutate({ userId: selectedUser.id, password: newValue });
    }
  };
  
  // Toggle admin status
  const toggleAdminStatus = (userId: string, currentStatus: boolean) => {
    toggleAdminMutation.mutate({ userId, isAdmin: !currentStatus });
  };
  
  // Filter users based on search query
  const filteredUsers = users?.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
    
    if (!profileLoading && profile && !profile.is_admin) {
      navigate("/dashboard", { replace: true });
      toast({
        title: "Zugriff verweigert",
        description: "Sie haben keine Berechtigung für diesen Bereich.",
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [user, authLoading, profile, profileLoading, navigate, toast]);
  
  if (authLoading || profileLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-beige animate-spin" />
      </div>
    );
  }
  
  if (!user || !profile?.is_admin) {
    return null;
  }
  
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <ButtonBeige 
            variant="ghost" 
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Zurück zum Dashboard
          </ButtonBeige>
          
          <h1 className="text-3xl font-bold text-beige mb-2">
            Benutzerverwaltung
          </h1>
          <p className="text-beige/70">
            Verwalten Sie Benutzerkonten und Berechtigungen.
          </p>
        </div>
        
        <div className="glass-beige p-8 rounded-xl">
          <div className="flex items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-beige/50" />
              <Input
                placeholder="Suche nach E-Mail oder Telefonnummer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border/50"
              />
            </div>
          </div>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-beige">E-Mail</TableHead>
                  <TableHead className="text-beige">Status</TableHead>
                  <TableHead className="text-beige">Letzter Login</TableHead>
                  <TableHead className="text-beige">Admin</TableHead>
                  <TableHead className="text-beige">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-beige">{user.email}</TableCell>
                    <TableCell className="text-beige">
                      {user.banned ? (
                        <span className="text-destructive">Gesperrt</span>
                      ) : (
                        <span className="text-green-500">Aktiv</span>
                      )}
                    </TableCell>
                    <TableCell className="text-beige/70">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('de-DE') : 'Nie'}
                    </TableCell>
                    <TableCell>
                      <div 
                        className={`w-4 h-4 rounded-full ${user.is_admin ? 'bg-green-500' : 'bg-gray-400'}`}
                        onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                        style={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <ButtonBeige 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEmailDialog(user)}
                        >
                          <Mail className="h-4 w-4" />
                        </ButtonBeige>
                        <ButtonBeige 
                          size="sm" 
                          variant="outline"
                          onClick={() => openPasswordDialog(user)}
                        >
                          <Key className="h-4 w-4" />
                        </ButtonBeige>
                        <ButtonBeige 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/admin/applications?user=${user.id}`)}
                        >
                          <UserCog className="h-4 w-4" />
                        </ButtonBeige>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-beige">
              {dialogType === "email" ? "E-Mail-Adresse ändern" : "Passwort ändern"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "email" 
                ? "Geben Sie die neue E-Mail-Adresse für den Benutzer ein."
                : "Geben Sie das neue Passwort für den Benutzer ein."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-value" className="text-beige">
                {dialogType === "email" ? "Neue E-Mail-Adresse" : "Neues Passwort"}
              </Label>
              <Input
                id="new-value"
                type={dialogType === "email" ? "email" : "password"}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="bg-background border-border/50"
              />
            </div>
          </div>
          <DialogFooter>
            <ButtonBeige 
              type="button" 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
            >
              Abbrechen
            </ButtonBeige>
            <ButtonBeige 
              type="submit" 
              onClick={handleDialogSubmit}
              disabled={updateEmailMutation.isPending || updatePasswordMutation.isPending}
            >
              {updateEmailMutation.isPending || updatePasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Speichern...
                </>
              ) : (
                "Speichern"
              )}
            </ButtonBeige>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
