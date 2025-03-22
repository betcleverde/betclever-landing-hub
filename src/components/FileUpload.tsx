
import { useState } from "react";
import { Loader2, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ButtonBeige } from "@/components/ui/button-beige";
import { Label } from "@/components/ui/label";

interface FileUploadProps {
  label: string;
  bucket: string;
  path: string;
  accept?: string;
  onUploadComplete: (url: string, fileName: string) => void;
  initialUrl?: string;
  initialFileName?: string;
  isUnlocked?: boolean;
}

const FileUpload = ({ 
  label, 
  bucket, 
  path, 
  accept = "image/*,.pdf", 
  onUploadComplete,
  initialUrl,
  initialFileName,
  isUnlocked = true
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(!!initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | undefined>(initialFileName);
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
      
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      setFileName(file.name);
      onUploadComplete(urlData.publicUrl, file.name);
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
            {fileName && <p className="text-beige/70 text-sm">{fileName}</p>}
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

export default FileUpload;
