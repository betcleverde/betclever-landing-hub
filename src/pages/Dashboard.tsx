
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, FileText, Users, Upload, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonBeige } from "@/components/ui/button-beige";
import SupportChat from "@/components/SupportChat";
import { Button } from "@/components/ui/button";
import { fromSupabase, Message } from "@/types/supportTickets";

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Fetch unread messages for the user
  useEffect(() => {
    if (!user) return;

    const fetchUnreadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_admin', true)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        
        // Count messages from last 24 hours as "unread" for simplicity
        // In a real app, you might want to store a "read" status for each message
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const recentMessages = fromSupabase<Message[]>(data).filter(msg => 
          new Date(msg.created_at) > oneDayAgo
        );
        
        setUnreadMessages(recentMessages.length);
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };

    fetchUnreadMessages();

    // Subscribe to new admin messages for real-time updates
    const subscription = supabase
      .channel('user_unread_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_tickets',
        filter: `user_id=eq.${user.id} AND is_admin=eq.true`,
      }, () => {
        fetchUnreadMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

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

  const { data: application, isLoading: applicationLoading } = useQuery({
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
  });

  if (isLoading || profileLoading || applicationLoading) {
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
            Willkommen zurück, {user.email}{profile?.is_admin ? " (Administrator)" : ""}
          </p>
        </div>

        {profile?.is_admin ? (
          <div className="glass-beige p-8 rounded-xl animate-fade-up animation-delay-400">
            <h2 className="text-2xl font-bold text-beige mb-4">Admin-Bereich</h2>
            <p className="text-beige text-lg mb-6">
              Als Administrator hast du Zugriff auf alle Funktionen und Daten der Plattform.
            </p>
            <ButtonBeige onClick={() => navigate("/admin/users")} className="mb-4">
              <Users className="mr-2 h-4 w-4" /> Benutzer verwalten
            </ButtonBeige>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <Card className="bg-black/30 border border-beige/20">
                <CardHeader>
                  <CardTitle className="text-beige">Übersicht</CardTitle>
                  <CardDescription className="text-beige/70">Alle Anträge und Status einsehen</CardDescription>
                </CardHeader>
                <CardContent>
                  <ButtonBeige onClick={() => navigate("/admin/applications")} className="w-full">
                    <FileText className="mr-2 h-4 w-4" /> Anträge anzeigen
                  </ButtonBeige>
                </CardContent>
              </Card>
              <Card className="bg-black/30 border border-beige/20">
                <CardHeader>
                  <CardTitle className="text-beige">Support Tickets</CardTitle>
                  <CardDescription className="text-beige/70">Benutzeranfragen bearbeiten</CardDescription>
                </CardHeader>
                <CardContent>
                  <ButtonBeige onClick={() => navigate("/admin/tickets")} className="w-full relative">
                    <MessageCircle className="mr-2 h-4 w-4" /> Tickets anzeigen
                    {unreadMessages > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </ButtonBeige>
                </CardContent>
              </Card>
              <Card className="bg-black/30 border border-beige/20">
                <CardHeader>
                  <CardTitle className="text-beige">Einstellungen</CardTitle>
                  <CardDescription className="text-beige/70">Admin-Einstellungen</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-beige/70 mb-4">In Entwicklung</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="animate-fade-up animation-delay-400">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-black/30 border border-beige/20">
                <CardHeader>
                  <CardTitle className="text-beige">Übersicht</CardTitle>
                  <CardDescription className="text-beige/70">Deine aktuellen Status</CardDescription>
                </CardHeader>
                <CardContent>
                  {application ? (
                    <div className="space-y-2">
                      <p className="text-beige">Status: <span className="font-semibold">{application.status}</span></p>
                      {application.admin_feedback && (
                        <p className="text-beige/70 text-sm">Feedback: {application.admin_feedback}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-beige/70">Noch kein Antrag eingereicht.</p>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-black/30 border border-beige/20">
                <CardHeader>
                  <CardTitle className="text-beige">Leitfaden</CardTitle>
                  <CardDescription className="text-beige/70">Hilfe und Anleitungen</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-beige/70">In Kürze verfügbar</p>
                </CardContent>
              </Card>
              <Card className="bg-black/30 border border-beige/20">
                <CardHeader>
                  <CardTitle className="text-beige">Tippgemeinschaft</CardTitle>
                  <CardDescription className="text-beige/70">Tippgemeinschaft starten</CardDescription>
                </CardHeader>
                <CardContent>
                  {application ? (
                    <p className="text-beige">
                      {application.status === "eingereicht" ? "Dein Antrag wird geprüft." : 
                       application.status === "freigegeben" ? "Dein Antrag wurde genehmigt!" : 
                       "Bitte überprüfe deine Angaben."}
                    </p>
                  ) : (
                    <ButtonBeige onClick={() => navigate("/tippgemeinschaft/anmelden")} className="w-full">
                      <Upload className="mr-2 h-4 w-4" /> Jetzt anmelden
                    </ButtonBeige>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {application && application.unlocked_fields && application.unlocked_fields.length > 0 && (
              <Card className="bg-card border border-border/50 mb-8">
                <CardHeader>
                  <CardTitle className="text-beige">Felder zur Überarbeitung freigegeben</CardTitle>
                  <CardDescription className="text-beige/70">
                    Der Administrator hat folgende Felder zur Überarbeitung freigegeben.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-beige/90">Bitte aktualisieren Sie die folgenden Informationen:</p>
                    <ul className="list-disc pl-5 text-beige/80">
                      {application.unlocked_fields.map((field: string) => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                    <ButtonBeige onClick={() => navigate("/tippgemeinschaft/anmelden")}>
                      Antrag bearbeiten
                    </ButtonBeige>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {!profile?.is_admin && <SupportChat />}
      </div>
    </div>
  );
};

export default Dashboard;
