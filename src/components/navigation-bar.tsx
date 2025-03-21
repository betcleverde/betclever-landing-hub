
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Menu, X, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ButtonBeige } from "./ui/button-beige";

const NavigationBar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
              className={`text-sm font-medium transition-colors hover:text-beige ${
                location.pathname === item.path
                  ? "text-beige"
                  : "text-beige/70"
              }`}
            >
              {item.name}
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
              className={`text-lg font-medium transition-colors hover:text-beige ${
                location.pathname === item.path
                  ? "text-beige"
                  : "text-beige/70"
              }`}
            >
              {item.name}
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
