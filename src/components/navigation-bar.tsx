
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Menu, X, User, MessageCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ButtonBeige } from "./ui/button-beige";
import { supabase } from "@/integrations/supabase/client";
import { Message, fromSupabase } from "@/types/supportTickets";

const NavigationBar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, logout, isLoading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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

  // Fetch unread messages count for admins
  useEffect(() => {
    if (!user || !isAdmin) return;

    const fetchUnreadMessages = async () => {
      try {
        // For admins, count all recently added messages from users 
        // (where is_admin is false as those are messages from users)
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('is_admin', false)
          .order('created_at', { ascending: false })
          .limit(100);  // Limit to recent messages

        if (error) throw error;
        
        // Count messages from last 24 hours as "unread" for simplicity
        // In a real app, you might want to store a "read" status for each message
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const recentMessages = fromSupabase<Message[]>(data).filter(msg => 
          new Date(msg.created_at) > oneDayAgo
        );
        
        // Get unique user IDs from recent messages to count conversations, not individual messages
        const uniqueUserIds = [...new Set(recentMessages.map(msg => msg.user_id))];
        setUnreadMessages(uniqueUserIds.length);
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };

    fetchUnreadMessages();

    // Subscribe to new messages for real-time updates
    const subscription = supabase
      .channel('admin_unread_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_tickets',
        filter: 'is_admin=eq.false',
      }, () => {
        fetchUnreadMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, isAdmin]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Teilnahme & Affiliate", path: "/participation" },
    { name: "Datenschutz", path: "/privacy" },
    ...(user ? [{ name: "Dashboard", path: "/dashboard" }] : []),
    ...(user && isAdmin ? [
      { 
        name: "Support Tickets", 
        path: "/admin/tickets",
        badge: unreadMessages > 0 ? unreadMessages : null 
      }
    ] : []),
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "py-3 bg-background/80 backdrop-blur-lg border-b border-border"
          : "py-5 bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link
          to="/"
          className="text-beige font-bold text-xl md:text-2xl tracking-tight transition-all"
        >
          BETCLEVER
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8 items-center">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`text-sm font-medium transition-colors hover:text-beige relative ${
                location.pathname === item.path
                  ? "text-beige"
                  : "text-beige/70"
              }`}
            >
              {item.name}
              {item.badge && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          ))}

          {!user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ButtonBeige
                  size="icon"
                  variant="ghost"
                  className="rounded-full"
                >
                  <User className="h-5 w-5" />
                </ButtonBeige>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-card border border-border"
              >
                <DropdownMenuLabel>Mein Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/login")}>
                  Anmelden
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/register")}>
                  Registrieren
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ButtonBeige
                  size="icon"
                  variant="ghost"
                  className="rounded-full"
                >
                  <User className="h-5 w-5" />
                </ButtonBeige>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-card border border-border"
              >
                <DropdownMenuLabel>
                  {user.email || "Mein Account"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  Profil
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin/users")}>
                      Benutzer verwalten
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/admin/applications")}>
                      Anträge verwalten
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/admin/tickets")} className="relative">
                      Support Tickets
                      {unreadMessages > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                      )}
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>Abmelden</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          {!mobileMenuOpen ? (
            <ButtonBeige
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-label="Open mobile menu"
            >
              <Menu className="h-6 w-6" />
            </ButtonBeige>
          ) : (
            <ButtonBeige
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-label="Close mobile menu"
            >
              <X className="h-6 w-6" />
            </ButtonBeige>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 bg-background pt-20 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col space-y-6 p-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`text-lg font-medium transition-colors hover:text-beige relative ${
                location.pathname === item.path
                  ? "text-beige"
                  : "text-beige/70"
              }`}
            >
              {item.name}
              {item.badge && (
                <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          ))}
          
          {!user ? (
            <div className="flex flex-col space-y-3 mt-6">
              <ButtonBeige onClick={() => navigate("/login")}>
                Anmelden
              </ButtonBeige>
              <ButtonBeige variant="outline" onClick={() => navigate("/register")}>
                Registrieren
              </ButtonBeige>
            </div>
          ) : (
            <ButtonBeige onClick={logout}>Abmelden</ButtonBeige>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
