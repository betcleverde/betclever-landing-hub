import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Search, ArrowLeft, Eye, Download, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ButtonBeige } from "@/components/ui/button-beige";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationData, fromSupabase } from "@/types/supportTickets";
import DeleteApplicationButton from "@/components/DeleteApplicationButton";

const AdminApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationData | null>(null);
  const [feedback, setFeedback] = useState("");
  const [unlockFields, setUnlockFields] = useState<Record<string, boolean>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!user) return;

    const checkAdminStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setIsAdmin(!!data.is_admin);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Fetch applications query
  const { data: applications, isLoading, error, refetch: fetchApplications } = useQuery({
    queryKey: ['tippgemeinschaft_applications'],
    queryFn: async () => {
      console.log("Fetching applications...");
      try {
        const { data, error } = await supabase
          .from('tippgemeinschaft_applications')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        console.log("Applications data:", data);
        return fromSupabase<ApplicationData[]>(data || []);
      } catch (err) {
        console.error("Error fetching applications:", err);
        throw err;
      }
    },
  });

  // Approve application mutation
  const approveMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from('tippgemeinschaft_applications')
        .update({ status: 'freigegeben' })
        .eq('id', applicationId);
      
      if (error) throw error;
      return applicationId;
    },
    onSuccess: () => {
      toast({
        title: "Antrag freigegeben",
        description: `Der Antrag wurde erfolgreich freigegeben.`,
      });
      fetchApplications();
      setDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error approving application:", error);
      toast({
        title: "Fehler",
        description: "Der Antrag konnte nicht freigegeben werden.",
        variant: "destructive",
      });
    }
  });

  // Reject application mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ applicationId, feedback, unlockFields }: { 
      applicationId: string; 
      feedback: string;
      unlockFields: string[];
    }) => {
      const { error } = await supabase
        .from('tippgemeinschaft_applications')
        .update({ 
          status: 'korrektur_erforderlich', 
          admin_feedback: feedback,
          unlocked_fields: unlockFields
        })
        .eq('id', applicationId);
      
      if (error) throw error;
      return applicationId;
    },
    onSuccess: () => {
      toast({
        title: "Korrektur angefordert",
        description: `Der Benutzer wurde über die erforderlichen Korrekturen informiert.`,
      });
      fetchApplications();
      setDialogOpen(false);
      setFeedback("");
      setUnlockFields({});
    },
    onError: (error) => {
      console.error("Error rejecting application:", error);
      toast({
        title: "Fehler",
        description: "Die Korrekturanforderung konnte nicht gesendet werden.",
        variant: "destructive",
      });
    }
  });

  // Filter applications based on search query
  const filteredApplications = applications?.filter(app => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      app.first_name?.toLowerCase().includes(searchLower) ||
      app.last_name?.toLowerCase().includes(searchLower) ||
      app.email?.toLowerCase().includes(searchLower) ||
      app.phone?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Open dialog for viewing application details
  const openViewDialog = (application: ApplicationData) => {
    setSelectedApplication(application);
    setDialogOpen(true);
  };

  // Open dialog for approving application
  const openApproveDialog = (application: ApplicationData) => {
    setSelectedApplication(application);
    if (application.id) {
      approveMutation.mutate(application.id);
    }
  };

  // Open dialog for rejecting application with feedback
  const openRejectDialog = (application: ApplicationData) => {
    setSelectedApplication(application);
    setFeedback("");
    setUnlockFields({});
    setDialogOpen(true);
  };

  // Handle reject confirmation
  const handleReject = () => {
    if (!selectedApplication?.id) return;
    
    const unlockedFieldsList = Object.entries(unlockFields)
      .filter(([_, value]) => value)
      .map(([key]) => key);
    
    rejectMutation.mutate({
      applicationId: selectedApplication.id,
      feedback,
      unlockFields: unlockedFieldsList
    });
  };

  // Check if user is authorized to view this page
  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
      toast({
        title: "Zugriff verweigert",
        description: "Sie haben keine Berechtigung, auf diese Seite zuzugreifen.",
        variant: "destructive",
      });
    }
  }, [isAdmin, navigate, toast]);

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
            Anträge verwalten
          </h1>
          <p className="text-beige/70">
            Verwalten und prüfen Sie Tippgemeinschaft-Anträge.
          </p>
        </div>
        
        <div className="glass-beige p-8 rounded-xl">
          <div className="flex items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-beige/50" />
              <Input
                placeholder="Suche nach Name, E-Mail oder Telefonnummer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border/50"
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-beige" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Fehler beim Laden der Anträge. Bitte versuchen Sie es später erneut.
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-8 text-beige/70">
              Keine Anträge gefunden.
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-beige">Name</TableHead>
                    <TableHead className="text-beige">E-Mail</TableHead>
                    <TableHead className="text-beige">Status</TableHead>
                    <TableHead className="text-beige">Datum</TableHead>
                    <TableHead className="text-beige">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium text-beige">
                        {app.first_name} {app.last_name}
                      </TableCell>
                      <TableCell className="text-beige">{app.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          app.status === 'freigegeben' 
                            ? 'bg-green-500/20 text-green-500' 
                            : app.status === 'korrektur_erforderlich'
                            ? 'bg-amber-500/20 text-amber-500'
                            : 'bg-beige/20 text-beige'
                        }`}>
                          {app.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-beige/70">
                        {new Date(app.created_at).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <ButtonBeige 
                            size="sm" 
                            variant="outline"
                            onClick={() => openViewDialog(app)}
                          >
                            <Eye className="h-4 w-4" />
                          </ButtonBeige>
                          <ButtonBeige 
                            size="sm" 
                            variant="outline"
                            onClick={() => openApproveDialog(app)}
                            disabled={app.status === 'freigegeben'}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </ButtonBeige>
                          <ButtonBeige 
                            size="sm" 
                            variant="outline"
                            onClick={() => openRejectDialog(app)}
                            disabled={app.status === 'korrektur_erforderlich'}
                          >
                            <XCircle className="h-4 w-4" />
                          </ButtonBeige>
                          <DeleteApplicationButton 
                            applicationId={app.id}
                            userName={`${app.first_name} ${app.last_name}`}
                            onDelete={() => fetchApplications()}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
      
      {/* Application Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border border-border max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-beige">
              {selectedApplication?.status === 'korrektur_erforderlich' 
                ? "Korrektur anfordern" 
                : `Antrag von ${selectedApplication?.first_name} ${selectedApplication?.last_name}`}
            </DialogTitle>
            <DialogDescription className="text-beige/70">
              {selectedApplication?.status === 'korrektur_erforderlich' 
                ? "Bitte geben Sie an, welche Felder korrigiert werden müssen und warum." 
                : "Details zum Antrag"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication?.status === 'korrektur_erforderlich' ? (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="feedback" className="text-beige">Feedback für den Benutzer</Label>
                  <Textarea 
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Bitte geben Sie an, warum der Antrag korrigiert werden muss..."
                    className="bg-background border-border mt-1.5"
                  />
                </div>
                
                <div>
                  <h4 className="text-beige mb-2">Felder zur Korrektur freigeben:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="unlock-name" 
                        checked={unlockFields.name || false}
                        onCheckedChange={(checked) => 
                          setUnlockFields(prev => ({ ...prev, name: checked === true }))
                        }
                      />
                      <Label htmlFor="unlock-name" className="text-beige">Name</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="unlock-email" 
                        checked={unlockFields.email || false}
                        onCheckedChange={(checked) => 
                          setUnlockFields(prev => ({ ...prev, email: checked === true }))
                        }
                      />
                      <Label htmlFor="unlock-email" className="text-beige">E-Mail</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="unlock-phone" 
                        checked={unlockFields.phone || false}
                        onCheckedChange={(checked) => 
                          setUnlockFields(prev => ({ ...prev, phone: checked === true }))
                        }
                      />
                      <Label htmlFor="unlock-phone" className="text-beige">Telefon</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="unlock-address" 
                        checked={unlockFields.address || false}
                        onCheckedChange={(checked) => 
                          setUnlockFields(prev => ({ ...prev, address: checked === true }))
                        }
                      />
                      <Label htmlFor="unlock-address" className="text-beige">Adresse</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="unlock-id-documents" 
                        checked={unlockFields.id_documents || false}
                        onCheckedChange={(checked) => 
                          setUnlockFields(prev => ({ ...prev, id_documents: checked === true }))
                        }
                      />
                      <Label htmlFor="unlock-id-documents" className="text-beige">Ausweisdokumente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="unlock-bank-documents" 
                        checked={unlockFields.bank_documents || false}
                        onCheckedChange={(checked) => 
                          setUnlockFields(prev => ({ ...prev, bank_documents: checked === true }))
                        }
                      />
                      <Label htmlFor="unlock-bank-documents" className="text-beige">Bankdokumente</Label>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <ButtonBeige variant="outline" onClick={() => setDialogOpen(false)}>
                  Abbrechen
                </ButtonBeige>
                <ButtonBeige 
                  disabled={!feedback || Object.values(unlockFields).every(v => !v)}
                  onClick={handleReject}
                >
                  Korrektur anfordern
                </ButtonBeige>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-beige">Persönliche Informationen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-beige/70">Name:</span> 
                      <span className="text-beige ml-2">
                        {selectedApplication?.first_name} {selectedApplication?.last_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-beige/70">E-Mail:</span> 
                      <span className="text-beige ml-2">{selectedApplication?.email}</span>
                    </div>
                    <div>
                      <span className="text-beige/70">Telefon:</span> 
                      <span className="text-beige ml-2">{selectedApplication?.phone}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-beige">Adresse</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-beige/70">Straße:</span> 
                      <span className="text-beige ml-2">
                        {selectedApplication?.street} {selectedApplication?.house_number}
                      </span>
                    </div>
                    <div>
                      <span className="text-beige/70">PLZ / Ort:</span> 
                      <span className="text-beige ml-2">
                        {selectedApplication?.postal_code} {selectedApplication?.city}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {selectedApplication?.id_front_url && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-beige">Ausweisdokumente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <ButtonBeige 
                          variant="outline" 
                          className="w-full"
                          onClick={() => window.open(selectedApplication.id_front_url)}
                        >
                          <Download className="mr-2 h-4 w-4" /> Ausweis Vorderseite
                        </ButtonBeige>
                      </div>
                      {selectedApplication.id_back_url && (
                        <div>
                          <ButtonBeige 
                            variant="outline" 
                            className="w-full"
                            onClick={() => window.open(selectedApplication.id_back_url)}
                          >
                            <Download className="mr-2 h-4 w-4" /> Ausweis Rückseite
                          </ButtonBeige>
                        </div>
                      )}
                      {selectedApplication.id_selfie_url && (
                        <div>
                          <ButtonBeige 
                            variant="outline" 
                            className="w-full"
                            onClick={() => window.open(selectedApplication.id_selfie_url)}
                          >
                            <Download className="mr-2 h-4 w-4" /> Selfie mit Ausweis
                          </ButtonBeige>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {(selectedApplication?.giro_front_url || selectedApplication?.credit_front_url) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-beige">Bankdokumente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedApplication.giro_front_url && (
                        <div>
                          <ButtonBeige 
                            variant="outline" 
                            className="w-full"
                            onClick={() => window.open(selectedApplication.giro_front_url)}
                          >
                            <Download className="mr-2 h-4 w-4" /> Girokarte Vorderseite
                          </ButtonBeige>
                        </div>
                      )}
                      {selectedApplication.giro_back_url && (
                        <div>
                          <ButtonBeige 
                            variant="outline" 
                            className="w-full"
                            onClick={() => window.open(selectedApplication.giro_back_url)}
                          >
                            <Download className="mr-2 h-4 w-4" /> Girokarte Rückseite
                          </ButtonBeige>
                        </div>
                      )}
                      {selectedApplication.credit_front_url && (
                        <div>
                          <ButtonBeige 
                            variant="outline" 
                            className="w-full"
                            onClick={() => window.open(selectedApplication.credit_front_url)}
                          >
                            <Download className="mr-2 h-4 w-4" /> Kreditkarte Vorderseite
                          </ButtonBeige>
                        </div>
                      )}
                      {selectedApplication.credit_back_url && (
                        <div>
                          <ButtonBeige 
                            variant="outline" 
                            className="w-full"
                            onClick={() => window.open(selectedApplication.credit_back_url)}
                          >
                            <Download className="mr-2 h-4 w-4" /> Kreditkarte Rückseite
                          </ButtonBeige>
                        </div>
                      )}
                      {selectedApplication.bank_documents_urls && selectedApplication.bank_documents_urls.length > 0 && (
                        <div>
                          {selectedApplication.bank_documents_urls.map((url, index) => (
                            <ButtonBeige 
                              key={index}
                              variant="outline" 
                              className="w-full mb-2"
                              onClick={() => window.open(url)}
                            >
                              <Download className="mr-2 h-4 w-4" /> Bankdokument {index + 1}
                            </ButtonBeige>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter>
                <ButtonBeige variant="outline" onClick={() => setDialogOpen(false)}>
                  Schließen
                </ButtonBeige>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApplications;
