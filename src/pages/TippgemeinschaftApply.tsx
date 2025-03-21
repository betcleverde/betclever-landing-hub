
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";
import { Loader2, Upload, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { ButtonBeige } from "@/components/ui/button-beige";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface FileUploadProps {
  label: string;
  bucket: string;
  path: string;
  accept?: string;
  onUploadComplete: (url: string) => void;
  initialUrl?: string;
  isUnlocked?: boolean;
}

const FileUpload = ({ 
  label, 
  bucket, 
  path, 
  accept = "image/*,.pdf", 
  onUploadComplete,
  initialUrl,
  isUnlocked = true
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(!!initialUrl);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) {
      return;
    }
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${path}-${Date.now()}.${fileExt}`;
    
    setUploading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });
      
      if (error) throw error;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      onUploadComplete(urlData.publicUrl);
      setUploaded(true);
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist beim Hochladen aufgetreten");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="space-y-2">
      <Label className="text-beige">{label}</Label>
      <div className="border-2 border-dashed border-beige/30 rounded-lg p-4 text-center">
        {uploaded ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center text-green-500">
              <CheckCircle className="w-8 h-8" />
            </div>
            <p className="text-beige">Datei hochgeladen</p>
            {isUnlocked && (
              <ButtonBeige 
                variant="outline" 
                onClick={() => document.getElementById(`file-${path}`)?.click()}
                disabled={uploading}
                size="sm"
              >
                Erneut hochladen
              </ButtonBeige>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {isUnlocked ? (
              <>
                <div className="flex items-center justify-center text-beige/70">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="text-beige/70">
                  Klicken oder ziehen Sie Ihre Datei hier hinein
                </p>
                <ButtonBeige 
                  variant="outline" 
                  onClick={() => document.getElementById(`file-${path}`)?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lädt hoch...
                    </>
                  ) : (
                    "Datei auswählen"
                  )}
                </ButtonBeige>
              </>
            ) : (
              <div className="flex items-center justify-center text-beige/70">
                <AlertCircle className="w-6 h-6 mr-2" />
                <span>Hochladen nicht möglich</span>
              </div>
            )}
          </div>
        )}
        {error && <p className="text-destructive text-sm mt-2">{error}</p>}
        <input
          id={`file-${path}`}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
          disabled={uploading || !isUnlocked}
        />
      </div>
    </div>
  );
};

const TippgemeinschaftApply = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    street: "",
    house_number: "",
    postal_code: "",
    city: "",
  });
  
  const [fileUrls, setFileUrls] = useState({
    id_front_url: "",
    id_back_url: "",
    id_selfie_url: "",
    giro_front_url: "",
    giro_back_url: "",
    credit_front_url: "",
    credit_back_url: "",
    bank_documents_urls: [] as string[],
  });
  
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  
  // Fetch existing application if any
  const { data: application, isLoading: fetchingApplication } = useQuery({
    queryKey: ['application', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('tippgemeinschaft_applications')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    onSuccess: (data) => {
      if (data) {
        // Pre-fill form with existing data
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          street: data.street || "",
          house_number: data.house_number || "",
          postal_code: data.postal_code || "",
          city: data.city || "",
        });
        
        setFileUrls({
          id_front_url: data.id_front_url || "",
          id_back_url: data.id_back_url || "",
          id_selfie_url: data.id_selfie_url || "",
          giro_front_url: data.giro_front_url || "",
          giro_back_url: data.giro_back_url || "",
          credit_front_url: data.credit_front_url || "",
          credit_back_url: data.credit_back_url || "",
          bank_documents_urls: data.bank_documents_urls || [],
        });
      }
    }
  });
  
  // Create or update application
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user) throw new Error("Not authenticated");
      
      if (application) {
        // Update existing application
        const { data: updateData, error } = await supabase
          .from('tippgemeinschaft_applications')
          .update({
            ...formData,
            ...fileUrls,
            updated_at: new Date().toISOString(),
            // If admin unlocked fields, reset them when user updates
            unlocked_fields: [],
            // Only reset status to 'eingereicht' if it was previously 'korrektur_erforderlich'
            ...(application.status === 'korrektur_erforderlich' ? { status: 'eingereicht' } : {}),
          })
          .eq('id', application.id)
          .select();
          
        if (error) throw error;
        return updateData;
      } else {
        // Create new application
        const { data: insertData, error } = await supabase
          .from('tippgemeinschaft_applications')
          .insert({
            user_id: user.id,
            ...formData,
            ...fileUrls,
          })
          .select();
          
        if (error) throw error;
        return insertData;
      }
    },
    onSuccess: () => {
      toast({
        title: application ? "Antrag aktualisiert" : "Antrag erfolgreich eingereicht",
        description: application 
          ? "Dein Antrag wurde erfolgreich aktualisiert und wird geprüft."
          : "Dein Antrag wurde erfolgreich eingereicht und wird geprüft.",
        duration: 5000,
      });
      navigate("/dashboard");
    },
    onError: (error) => {
      console.error("Application submission error:", error);
      toast({
        title: "Fehler beim Einreichen",
        description: "Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });
  
  // Check if the field is unlocked for editing
  const isFieldUnlocked = (fieldName: string) => {
    if (!application || !application.unlocked_fields) return true;
    if (application.unlocked_fields.length === 0) return false;
    return application.unlocked_fields.includes(fieldName);
  };
  
  // Add a bank document URL
  const addBankDocumentUrl = (url: string) => {
    setFileUrls(prev => ({
      ...prev,
      bank_documents_urls: [...prev.bank_documents_urls, url]
    }));
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, authLoading, navigate]);
  
  if (authLoading || fetchingApplication) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-beige animate-spin" />
      </div>
    );
  }
  
  const renderPersonalInfoForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="first_name" className="text-beige">Vorname</Label>
          <Input
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            className="bg-background border-border/50"
            required
            disabled={!isFieldUnlocked('first_name')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name" className="text-beige">Nachname</Label>
          <Input
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            className="bg-background border-border/50"
            required
            disabled={!isFieldUnlocked('last_name')}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email" className="text-beige">E-Mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          className="bg-background border-border/50"
          required
          disabled={!isFieldUnlocked('email')}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-beige">Telefonnummer (mit +49)</Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          className="bg-background border-border/50"
          placeholder="+49"
          required
          disabled={!isFieldUnlocked('phone')}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="street" className="text-beige">Straße</Label>
          <Input
            id="street"
            name="street"
            value={formData.street}
            onChange={handleInputChange}
            className="bg-background border-border/50"
            required
            disabled={!isFieldUnlocked('street')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="house_number" className="text-beige">Hausnummer</Label>
          <Input
            id="house_number"
            name="house_number"
            value={formData.house_number}
            onChange={handleInputChange}
            className="bg-background border-border/50"
            required
            disabled={!isFieldUnlocked('house_number')}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="postal_code" className="text-beige">Postleitzahl</Label>
          <Input
            id="postal_code"
            name="postal_code"
            value={formData.postal_code}
            onChange={handleInputChange}
            className="bg-background border-border/50"
            required
            disabled={!isFieldUnlocked('postal_code')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city" className="text-beige">Ort</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="bg-background border-border/50"
            required
            disabled={!isFieldUnlocked('city')}
          />
        </div>
      </div>
    </div>
  );

  const renderIdentityDocumentsForm = () => (
    <div className="space-y-6">
      <p className="text-beige">
        Bitte laden Sie Ihre Ausweisdokumente hoch. Achten Sie darauf, dass alle Informationen gut lesbar sind.
      </p>
      
      <FileUpload
        label="Ausweis Vorderseite"
        bucket="identity_documents"
        path="id-front"
        onUploadComplete={(url) => setFileUrls(prev => ({ ...prev, id_front_url: url }))}
        initialUrl={fileUrls.id_front_url}
        isUnlocked={isFieldUnlocked('id_front_url')}
      />
      
      <FileUpload
        label="Ausweis Rückseite"
        bucket="identity_documents"
        path="id-back"
        onUploadComplete={(url) => setFileUrls(prev => ({ ...prev, id_back_url: url }))}
        initialUrl={fileUrls.id_back_url}
        isUnlocked={isFieldUnlocked('id_back_url')}
      />
      
      <FileUpload
        label="Selfie mit Ausweis neben dem Kopf"
        bucket="identity_documents"
        path="id-selfie"
        onUploadComplete={(url) => setFileUrls(prev => ({ ...prev, id_selfie_url: url }))}
        initialUrl={fileUrls.id_selfie_url}
        isUnlocked={isFieldUnlocked('id_selfie_url')}
      />
    </div>
  );

  const renderBankCardsForm = () => (
    <div className="space-y-6">
      <p className="text-beige">
        Bitte laden Sie Bilder Ihrer Bankkarten hoch. Achten Sie darauf, dass alle Informationen gut lesbar sind.
      </p>
      
      <FileUpload
        label="Girokarte Vorderseite"
        bucket="bank_cards"
        path="giro-front"
        onUploadComplete={(url) => setFileUrls(prev => ({ ...prev, giro_front_url: url }))}
        initialUrl={fileUrls.giro_front_url}
        isUnlocked={isFieldUnlocked('giro_front_url')}
      />
      
      <FileUpload
        label="Girokarte Rückseite"
        bucket="bank_cards"
        path="giro-back"
        onUploadComplete={(url) => setFileUrls(prev => ({ ...prev, giro_back_url: url }))}
        initialUrl={fileUrls.giro_back_url}
        isUnlocked={isFieldUnlocked('giro_back_url')}
      />
      
      <FileUpload
        label="Debit/Kreditkarte Vorderseite"
        bucket="bank_cards"
        path="credit-front"
        onUploadComplete={(url) => setFileUrls(prev => ({ ...prev, credit_front_url: url }))}
        initialUrl={fileUrls.credit_front_url}
        isUnlocked={isFieldUnlocked('credit_front_url')}
      />
      
      <FileUpload
        label="Debit/Kreditkarte Rückseite"
        bucket="bank_cards"
        path="credit-back"
        onUploadComplete={(url) => setFileUrls(prev => ({ ...prev, credit_back_url: url }))}
        initialUrl={fileUrls.credit_back_url}
        isUnlocked={isFieldUnlocked('credit_back_url')}
      />
    </div>
  );

  const renderBankDocumentsForm = () => (
    <div className="space-y-6">
      <p className="text-beige">
        Bitte laden Sie Ihre weiteren Bankdokumente hoch (z.B. Internetpin, Telefonpin, Wunschpin).
      </p>
      
      <FileUpload
        label="Bankdokumente hochladen"
        bucket="bank_documents"
        path={`bank-doc-${fileUrls.bank_documents_urls.length + 1}`}
        accept=".pdf,.png,.jpg,.jpeg"
        onUploadComplete={addBankDocumentUrl}
        isUnlocked={isFieldUnlocked('bank_documents_urls')}
      />
      
      {fileUrls.bank_documents_urls.length > 0 && (
        <div className="mt-4">
          <h4 className="text-beige font-medium mb-2">Hochgeladene Dokumente:</h4>
          <ul className="space-y-2">
            {fileUrls.bank_documents_urls.map((url, index) => (
              <li key={index} className="flex items-center text-beige">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Dokument {index + 1}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderConfirmationForm = () => (
    <div className="space-y-6">
      <p className="text-beige">
        Bitte überprüfen Sie Ihre Angaben sorgfältig und bestätigen Sie, dass alle Informationen korrekt sind.
      </p>
      
      <Card className="bg-black/30 border border-beige/20">
        <CardHeader>
          <CardTitle className="text-beige">Persönliche Daten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-2 text-beige/80">
            <div>Name:</div>
            <div>{formData.first_name} {formData.last_name}</div>
            <div>E-Mail:</div>
            <div>{formData.email}</div>
            <div>Telefon:</div>
            <div>{formData.phone}</div>
            <div>Adresse:</div>
            <div>{formData.street} {formData.house_number}, {formData.postal_code} {formData.city}</div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-black/30 border border-beige/20">
        <CardHeader>
          <CardTitle className="text-beige">Dokumente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-2 text-beige/80">
            <div>Ausweis-Dokumente:</div>
            <div>{fileUrls.id_front_url && fileUrls.id_back_url && fileUrls.id_selfie_url ? "Vollständig" : "Unvollständig"}</div>
            <div>Bankkarten:</div>
            <div>{fileUrls.giro_front_url && fileUrls.giro_back_url && fileUrls.credit_front_url && fileUrls.credit_back_url ? "Vollständig" : "Unvollständig"}</div>
            <div>Bankdokumente:</div>
            <div>{fileUrls.bank_documents_urls.length > 0 ? `${fileUrls.bank_documents_urls.length} Dokument(e)` : "Keine"}</div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="terms" 
          checked={agreeTerms}
          onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
        />
        <label
          htmlFor="terms"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-beige/80"
        >
          Ich bestätige, dass alle angegebenen Informationen korrekt sind und ich die Dokumente ordnungsgemäß hochgeladen habe.
        </label>
      </div>
    </div>
  );

  const renderActiveStep = () => {
    switch (activeStep) {
      case 1:
        return renderPersonalInfoForm();
      case 2:
        return renderIdentityDocumentsForm();
      case 3:
        return renderBankCardsForm();
      case 4:
        return renderBankDocumentsForm();
      case 5:
        return renderConfirmationForm();
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (activeStep) {
      case 1:
        return (
          formData.first_name && 
          formData.last_name && 
          formData.email && 
          formData.phone && 
          formData.street && 
          formData.house_number && 
          formData.postal_code && 
          formData.city
        );
      case 2:
        return fileUrls.id_front_url && fileUrls.id_back_url && fileUrls.id_selfie_url;
      case 3:
        return fileUrls.giro_front_url && fileUrls.giro_back_url && fileUrls.credit_front_url && fileUrls.credit_back_url;
      case 4:
        return fileUrls.bank_documents_urls.length > 0;
      case 5:
        return agreeTerms;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (activeStep < 5) {
      setActiveStep(activeStep + 1);
    } else {
      // Submit form
      mutation.mutate({});
    }
  };

  const handleBack = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    } else {
      navigate("/dashboard");
    }
  };

  const getStepTitle = () => {
    switch (activeStep) {
      case 1: return "Persönliche Daten";
      case 2: return "Ausweisdokumente";
      case 3: return "Bankkarten";
      case 4: return "Bankdokumente";
      case 5: return "Überprüfung und Bestätigung";
      default: return "";
    }
  };

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-8">
          <ButtonBeige 
            variant="ghost" 
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
          </ButtonBeige>
          
          <h1 className="text-3xl font-bold text-beige mb-2">
            Tippgemeinschaft Anmeldung
          </h1>
          <p className="text-beige/70">
            Schritt {activeStep} von 5: {getStepTitle()}
          </p>
        </div>
        
        <div className="glass-beige p-8 rounded-xl">
          {renderActiveStep()}
          
          <div className="mt-8 flex justify-between">
            <ButtonBeige 
              variant="outline"
              onClick={handleBack}
            >
              {activeStep === 1 ? "Abbrechen" : "Zurück"}
            </ButtonBeige>
            
            <ButtonBeige 
              onClick={handleNext}
              disabled={!canProceed() || mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Bitte warten...
                </>
              ) : activeStep === 5 ? "Einreichen" : "Weiter"}
            </ButtonBeige>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TippgemeinschaftApply;
