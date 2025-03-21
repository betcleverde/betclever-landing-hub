
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
            Willkommen zurück, {user.name || user.email}
          </p>
        </div>

        <div className="glass-beige p-8 rounded-xl animate-fade-up animation-delay-400">
          <p className="text-beige text-lg">
            Das Dashboard wird derzeit entwickelt und steht in Kürze zur Verfügung.
          </p>
          <p className="text-beige/70 mt-4">
            Hier werden Sie bald Ihre Statistiken, Einnahmen und Referrals einsehen können.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
