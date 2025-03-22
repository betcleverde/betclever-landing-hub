import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Search, ArrowLeft, Eye, Download, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { ButtonBeige } from "@/components/ui/button-beige";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AdminApplications = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"view" | "edit" | "approve" | "reject">("view");
  const [feedback, setFeedback] = useState("");
  const [unlockedFields, setUnlockedFields] = useState<string[]>([]);
  
  // Get user ID from URL query params
  const params = new URLSearchParams(location.search);
  const filterUserId = params.get("user");
  
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
  
  // Fetch all applications
  const { data: applications, isLoading: applicationsLoading, refetch: refetchApplications } = useQuery({
    queryKey: ['admin-applications', filterUserId],
    queryFn: async () => {
      try {
        // Build query
        let query = supabase
          .from('tippgemeinschaft_applications')
          .select();
        
        // Apply user filter if provided
        if (filterUserId) {
          query = query.eq('user_id', filterUserId);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching applications:", error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          console.log("No applications found");
          return [];
        }
        
        console.log("Fetched applications:", data);
        return data;
      } catch (error) {
        console.error("Error in queryFn:", error);
        return [];
      }
    },
    enabled: !!user && !!profile?.is_admin,
  });
  
  // Approve application
  const approveApplicationMutation = useMutation({
    mutationFn: async ({ id, feedback }: { id: string, feedback?: string }) => {
      const { data, error } = await supabase
        .from('tippgemeinschaft_applications')
        .update({ 
          status: 'freigegeben',
          admin_feedback: feedback || null,
          unlocked_fields: []
        })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Antrag freigegeben",
        description: "Der Antrag wurde erfolgreich freigegeben.",
        duration: 3000,
      });
      setDialogOpen(false);
      refetchApplications();
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Antrag konnte nicht freigegeben werden.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });
  
  // Reject application with feedback
  const rejectApplicationMutation = useMutation({
    mutationFn: async ({ id, feedback, unlockedFields }: { id: string, feedback: string, unlockedFields: string[] }) => {
      const { data, error } = await supabase
        .from('tippgemeinschaft_applications')
        .update({ 
          status: 'korrektur_erforderlich',
          admin_feedback: feedback,
          unlocked_fields: unlockedFields
        })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Antrag zurückgewiesen",
        description: "Der Antrag wurde zur Korrektur zurückgewiesen.",
        duration: 3000,
      });
      setDialogOpen(false);
      refetchApplications();
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Antrag konnte nicht zurückgewiesen werden.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });
  
  // Download file
  const downloadFile = async (bucketName: string, filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);
        
      if (error) throw error;
      
      // Create a blob URL and trigger download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: "Fehler beim Herunterladen",
        description: error.message || "Die Datei konnte nicht heruntergeladen werden.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };
  
  // Extract bucket and path from URL
  const extractBucketAndPath = (url: string) => {
    if (!url) return { bucket: "", path: "" };
    
    // Example URL: https://lyowetrsgzypudijzvmb.supabase.co/storage/v1/object/public/identity_documents/123-456/id-front-12345.jpg
    const parts = url.split('/storage/v1/object/public/');
    if (parts.length < 2) return { bucket: "", path: "" };
    
    const bucketAndPath = parts[1];
    const slashIndex = bucketAndPath.indexOf('/');
    
    if (slashIndex === -1) return { bucket: "", path: "" };
    
    const bucket = bucketAndPath.substring(0, slashIndex);
    const path = bucketAndPath.substring(slashIndex + 1);
    
    return { bucket, path };
  };
  
  // Open view dialog
  const openViewDialog = (application: any) => {
    setSelectedApplication(application);
    setDialogType("view");
    setDialogOpen(true);
  };
  
  // Open approve dialog
  const openApproveDialog = (application: any) => {
    setSelectedApplication(application);
    setDialogType("approve");
    setFeedback("");
    setDialogOpen(true);
  };
  
  // Open reject dialog
  const openRejectDialog = (application: any) => {
    setSelectedApplication(application);
    setDialogType("reject");
    setFeedback("");
    setUnlockedFields([]);
    setDialogOpen(true);
  };
  
  // Handle dialog submit
  const handleDialogSubmit = () => {
    if (!selectedApplication) return;
    
    if (dialogType === "approve") {
      approveApplicationMutation.mutate({ 
        id: selectedApplication.id, 
        feedback 
      });
    } else if (dialogType === "reject") {
      if (!feedback) {
        toast({
          title: "Feedback erforderlich",
          description: "Bitte geben Sie ein Feedback für den Benutzer ein.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      rejectApplicationMutation.mutate({ 
        id: selectedApplication.id, 
        feedback,
        unlockedFields
      });
    }
  };
  
  // Toggle unlocked field
  const toggleUnlockedField = (field: string) => {
    if (unlockedFields.includes(field)) {
      setUnlockedFields(unlockedFields.filter(f => f !== field));
    } else {
      setUnlockedFields([...unlockedFields, field]);
    }
  };
  
  // Filter applications based on search query
  const filteredApplications = applications?.filter(app => 
    app.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.phone?.toLowerCase().includes(searchQuery.toLowerCase())
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
  
  if (authLoading || profileLoading || applicationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-beige animate-spin" />
      </div>
    );
  }
  
  if (!user || !profile?.is_admin) {
    return null;
  }
  
  console.log("Rendered applications:", filteredApplications);
  
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
          
          {filteredApplications?.length === 0 ? (
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
                  {filteredApplications?.map((app) => (
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
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-beige">
              {dialogType === "view" 
                ? "Antrag anzeigen" 
                : dialogType === "approve" 
                ? "Antrag freigeben" 
                : "Antrag zur Korrektur zurückweisen"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "view" 
                ? "Details des Antrags" 
                : dialogType === "approve" 
                ? "Bestätigen Sie die Freigabe des Antrags" 
                : "Geben Sie Feedback und wählen Sie die zu korrigierenden Felder aus"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="max-h-[70vh] overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card border border-border/50">
                  <CardHeader>
                    <CardTitle className="text-beige">Persönliche Daten</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div className="text-beige/70">Vorname:</div>
                        <div className="text-beige">{selectedApplication.first_name}</div>
                        
                        <div className="text-beige/70">Nachname:</div>
                        <div className="text-beige">{selectedApplication.last_name}</div>
                        
                        <div className="text-beige/70">E-Mail:</div>
                        <div className="text-beige">{selectedApplication.email}</div>
                        
                        <div className="text-beige/70">Telefon:</div>
                        <div className="text-beige">{selectedApplication.phone}</div>
                        
                        <div className="text-beige/70">Adresse:</div>
                        <div className="text-beige">
                          {selectedApplication.street} {selectedApplication.house_number}, 
                          {selectedApplication.postal_code} {selectedApplication.city}
                        </div>
                      </div>
                      
                      {dialogType === "reject" && (
                        <div className="mt-4 pt-4 border-t border-beige/20">
                          <p className="text-beige font-medium mb-2">Felder zur Überarbeitung freigeben:</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="first_name_field" 
                                checked={unlockedFields.includes('first_name')}
                                onCheckedChange={() => toggleUnlockedField('first_name')}
                              />
                              <label htmlFor="first_name_field" className="text-beige/70">Vorname</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="last_name_field" 
                                checked={unlockedFields.includes('last_name')}
                                onCheckedChange={() => toggleUnlockedField('last_name')}
                              />
                              <label htmlFor="last_name_field" className="text-beige/70">Nachname</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="email_field" 
                                checked={unlockedFields.includes('email')}
                                onCheckedChange={() => toggleUnlockedField('email')}
                              />
                              <label htmlFor="email_field" className="text-beige/70">E-Mail</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="phone_field" 
                                checked={unlockedFields.includes('phone')}
                                onCheckedChange={() => toggleUnlockedField('phone')}
                              />
                              <label htmlFor="phone_field" className="text-beige/70">Telefon</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="street_field" 
                                checked={unlockedFields.includes('street')}
                                onCheckedChange={() => toggleUnlockedField('street')}
                              />
                              <label htmlFor="street_field" className="text-beige/70">Straße</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="house_number_field" 
                                checked={unlockedFields.includes('house_number')}
                                onCheckedChange={() => toggleUnlockedField('house_number')}
                              />
                              <label htmlFor="house_number_field" className="text-beige/70">Hausnummer</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="postal_code_field" 
                                checked={unlockedFields.includes('postal_code')}
                                onCheckedChange={() => toggleUnlockedField('postal_code')}
                              />
                              <label htmlFor="postal_code_field" className="text-beige/70">PLZ</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="city_field" 
                                checked={unlockedFields.includes('city')}
                                onCheckedChange={() => toggleUnlockedField('city')}
                              />
                              <label htmlFor="city_field" className="text-beige/70">Ort</label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card border border-border/50">
                  <CardHeader>
                    <CardTitle className="text-beige">Dokumente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-beige font-medium">Ausweisdokumente:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {selectedApplication.id_front_url && (
                          <div className="flex items-center justify-between">
                            <span className="text-beige/70">Ausweis Vorderseite</span>
                            <div className="flex space-x-2">
                              {dialogType === "reject" && (
                                <Checkbox 
                                  id="id_front_url_field" 
                                  checked={unlockedFields.includes('id_front_url')}
                                  onCheckedChange={() => toggleUnlockedField('id_front_url')}
                                />
                              )}
                              <ButtonBeige 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const { bucket, path } = extractBucketAndPath(selectedApplication.id_front_url);
                                  if (bucket && path) {
                                    downloadFile(bucket, path);
                                  }
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </ButtonBeige>
                            </div>
                          </div>
                        )}
                        
                        {selectedApplication.id_back_url && (
                          <div className="flex items-center justify-between">
                            <span className="text-beige/70">Ausweis Rückseite</span>
                            <div className="flex space-x-2">
                              {dialogType === "reject" && (
                                <Checkbox 
                                  id="id_back_url_field" 
                                  checked={unlockedFields.includes('id_back_url')}
                                  onCheckedChange={() => toggleUnlockedField('id_back_url')}
                                />
                              )}
                              <ButtonBeige 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const { bucket, path } = extractBucketAndPath(selectedApplication.id_back_url);
                                  if (bucket && path) {
                                    downloadFile(bucket, path);
                                  }
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </ButtonBeige>
                            </div>
                          </div>
                        )}
                        
                        {selectedApplication.id_selfie_url && (
                          <div className="flex items-center justify-between">
                            <span className="text-beige/70">Selfie mit Ausweis</span>
                            <div className="flex space-x-2">
                              {dialogType === "reject" && (
                                <Checkbox 
                                  id="id_selfie_url_field" 
                                  checked={unlockedFields.includes('id_selfie_url')}
                                  onCheckedChange={() => toggleUnlockedField('id_selfie_url')}
                                />
                              )}
                              <ButtonBeige 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const { bucket, path } = extractBucketAndPath(selectedApplication.id_selfie_url);
                                  if (bucket && path) {
                                    downloadFile(bucket, path);
                                  }
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </ButtonBeige>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-beige font-medium mt-4">Bankkarten:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {selectedApplication.giro_front_url && (
                          <div className="flex items-center justify-between">
                            <span className="text-beige/70">Girokarte Vorderseite</span>
                            <div className="flex space-x-2">
                              {dialogType === "reject" && (
                                <Checkbox 
                                  id="giro_front_url_field" 
                                  checked={unlockedFields.includes('giro_front_url')}
                                  onCheckedChange={() => toggleUnlockedField('giro_front_url')}
                                />
                              )}
                              <ButtonBeige 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const { bucket, path } = extractBucketAndPath(selectedApplication.giro_front_url);
                                  if (bucket && path) {
                                    downloadFile(bucket, path);
                                  }
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </ButtonBeige>
                            </div>
                          </div>
                        )}
                        
                        {selectedApplication.giro_back_url && (
                          <div className="flex items-center justify-between">
                            <span className="text-beige/70">Girokarte Rückseite</span>
                            <div className="flex space-x-2">
                              {dialogType === "reject" && (
                                <Checkbox 
                                  id="giro_back_url_field" 
                                  checked={unlockedFields.includes('giro_back_url')}
                                  onCheckedChange={() => toggleUnlockedField('giro_back_url')}
                                />
                              )}
                              <ButtonBeige 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const { bucket, path } = extractBucketAndPath(selectedApplication.giro_back_url);
                                  if (bucket && path) {
                                    downloadFile(bucket, path);
                                  }
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </ButtonBeige>
                            </div>
                          </div>
                        )}
                        
                        {selectedApplication.credit_front_url && (
                          <div className="flex items-center justify-between">
                            <span className="text-beige/70">Kreditkarte Vorderseite</span>
                            <div className="flex space-x-2">
                              {dialogType === "reject" && (
                                <Checkbox 
                                  id="credit_front_url_field" 
                                  checked={unlockedFields.includes('credit_front_url')}
                                  onCheckedChange={() => toggleUnlockedField('credit_front_url')}
                                />
                              )}
                              <ButtonBeige 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const { bucket, path } = extractBucketAndPath(selectedApplication.credit_front_url);
                                  if (bucket && path) {
                                    downloadFile(bucket, path);
                                  }
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </ButtonBeige>
                            </div>
                          </div>
                        )}
                        
                        {selectedApplication.credit_back_url && (
                          <div className="flex items-center justify-between">
                            <span className="text-beige/70">Kreditkarte Rückseite</span>
                            <div className="flex space-x-2">
                              {dialogType === "reject" && (
                                <Checkbox 
                                  id="credit_back_url_field" 
                                  checked={unlockedFields.includes('credit_back_url')}
                                  onCheckedChange={() => toggleUnlockedField('credit_back_url')}
                                />
                              )}
                              <ButtonBeige 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const { bucket, path } = extractBucketAndPath(selectedApplication.credit_back_url);
                                  if (bucket && path) {
                                    downloadFile(bucket, path);
                                  }
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </ButtonBeige>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {selectedApplication.bank_documents_urls && selectedApplication.bank_documents_urls.length > 0 && (
                        <>
                          <p className="text-beige font-medium mt-4">Bankdokumente:</p>
                          <div className="grid grid-cols-1 gap-2">
                            {selectedApplication.bank_documents_urls.map((url: string, index: number) => (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-beige/70">Dokument {index + 1}</span>
                                <div className="flex space-x-2">
                                  {dialogType === "reject" && index === 0 && (
                                    <Checkbox 
                                      id="bank_documents_urls_field" 
                                      checked={unlockedFields.includes('bank_documents_urls')}
                                      onCheckedChange={() => toggleUnlockedField('bank_documents_urls')}
                                    />
                                  )}
                                  <ButtonBeige 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      const { bucket, path } = extractBucketAndPath(url);
                                      if (bucket && path) {
                                        downloadFile(bucket, path);
                                      }
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                  </ButtonBeige>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {(dialogType === "approve" || dialogType === "reject") && (
                <div className="mt-6">
                  <Label htmlFor="feedback" className="text-beige">Feedback für den Benutzer</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={dialogType === "approve" 
                      ? "Optionales Feedback bei Freigabe..." 
                      : "Geben Sie dem Benutzer Feedback, was korrigiert werden muss..."}
                    className="h-24 mt-2 bg-background border-border/50"
                    required={dialogType === "reject"}
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <ButtonBeige 
              type="button" 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
            >
              {dialogType === "view" ? "Schließen" : "Abbrechen"}
            </ButtonBeige>
            
            {dialogType !== "view" && (
              <ButtonBeige 
                type="submit" 
                onClick={handleDialogSubmit}
                disabled={
                  (dialogType === "reject" && (!feedback || unlockedFields.length === 0)) ||
                  approveApplicationMutation.isPending || 
                  rejectApplicationMutation.isPending
                }
              >
                {approveApplicationMutation.isPending || rejectApplicationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Bitte warten...
                  </>
                ) : dialogType === "approve" ? (
                  "Freigeben"
                ) : (
                  "Zurückweisen"
                )}
              </ButtonBeige>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApplications;
