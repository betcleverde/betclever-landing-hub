
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate, Link } from "react-router-dom";
import { ButtonBeige } from "@/components/ui/button-beige";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(email, password);
      navigate("/dashboard");
      toast({
        title: "Erfolgreich angemeldet",
        description: "Willkommen zurück bei BETCLEVER",
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
            Anmelden
          </h1>
          <p className="text-beige/70 animate-fade-up animation-delay-200">
            Melde dich an, um auf dein Dashboard zuzugreifen
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-8 shadow-xl animate-fade-up animation-delay-400">
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Passwort</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-beige hover:underline"
                >
                  Passwort vergessen?
                </Link>
              </div>
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

            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}

            <ButtonBeige type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Bitte warten...
                </>
              ) : (
                "Anmelden"
              )}
            </ButtonBeige>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-beige/70">
              Noch kein Konto?{" "}
              <Link to="/register" className="text-beige hover:underline">
                Registrieren
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
