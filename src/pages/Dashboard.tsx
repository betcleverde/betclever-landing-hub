
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-beige animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-beige mb-4 animate-fade-in">
            Dashboard
          </h1>
          <p className="text-beige/70 animate-fade-up animation-delay-200">
            Willkommen zurück, {user.name || user.email}{user.isAdmin ? " (Administrator)" : ""}
          </p>
        </div>

        {user.isAdmin ? (
          <div className="glass-beige p-8 rounded-xl animate-fade-up animation-delay-400">
            <h2 className="text-2xl font-bold text-beige mb-4">Admin-Bereich</h2>
            <p className="text-beige text-lg mb-4">
              Als Administrator hast du Zugriff auf alle Funktionen und Daten der Plattform.
            </p>
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-black/30 p-6 rounded-lg border border-beige/20">
                <h3 className="text-xl font-semibold text-beige mb-2">Benutzer verwalten</h3>
                <p className="text-beige/70">
                  Alle registrierten Benutzer einsehen und verwalten.
                </p>
              </div>
              <div className="bg-black/30 p-6 rounded-lg border border-beige/20">
                <h3 className="text-xl font-semibold text-beige mb-2">Statistiken</h3>
                <p className="text-beige/70">
                  Plattformstatistiken und Nutzungsanalysen einsehen.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-beige p-8 rounded-xl animate-fade-up animation-delay-400">
            <p className="text-beige text-lg">
              Das Dashboard wird derzeit entwickelt und steht in Kürze zur Verfügung.
            </p>
            <p className="text-beige/70 mt-4">
              Hier werden Sie bald Ihre Statistiken, Einnahmen und Referrals einsehen können.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
