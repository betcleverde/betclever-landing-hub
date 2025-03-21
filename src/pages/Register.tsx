
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate, Link } from "react-router-dom";
import { ButtonBeige } from "@/components/ui/button-beige";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const { register, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (password !== confirmPassword) {
      setFormError("Die Passwörter stimmen nicht überein");
      return;
    }
    
    if (!agreeTerms) {
      setFormError("Bitte akzeptiere die Nutzungsbedingungen und Datenschutzbestimmungen");
      return;
    }
    
    try {
      await register(email, password);
      navigate("/dashboard");
      toast({
        title: "Registrierung erfolgreich",
        description: "Willkommen bei BETCLEVER!",
        duration: 3000,
      });
    } catch (err) {
      // Error is handled in auth context
    }
  };

  return (
    <div className="pt-32 pb-24 px-6 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-beige mb-2 animate-fade-in">
            Registrieren
          </h1>
          <p className="text-beige/70 animate-fade-up animation-delay-200">
            Erstelle ein Konto bei BETCLEVER
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-8 shadow-xl animate-fade-up animation-delay-400">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                required
                className="bg-background border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-background border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-background border-border/50"
              />
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreeTerms}
                onCheckedChange={(checked) => 
                  setAgreeTerms(checked as boolean)
                }
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-beige/80"
              >
                Ich stimme den{" "}
                <Link to="/terms" className="text-beige hover:underline">
                  Nutzungsbedingungen
                </Link>{" "}
                und{" "}
                <Link to="/privacy" className="text-beige hover:underline">
                  Datenschutzbestimmungen
                </Link>{" "}
                zu
              </label>
            </div>

            {(formError || error) && (
              <div className="text-destructive text-sm">
                {formError || error}
              </div>
            )}

            <ButtonBeige type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registriere...
                </>
              ) : (
                "Registrieren"
              )}
            </ButtonBeige>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-beige/70">
              Bereits ein Konto?{" "}
              <Link to="/login" className="text-beige hover:underline">
                Anmelden
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
