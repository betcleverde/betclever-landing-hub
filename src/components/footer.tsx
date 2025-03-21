
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary pt-16 pb-8 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <h3 className="text-beige text-xl font-bold tracking-tight">BETCLEVER</h3>
            <p className="text-beige/70 text-sm leading-relaxed">
              Dein Weg zu garantierten Gewinnen durch unser spezialisiertes
              Matched Betting System.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-beige font-medium">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-beige/70 text-sm hover:text-beige transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/participation"
                  className="text-beige/70 text-sm hover:text-beige transition-colors"
                >
                  Teilnahme & Affiliate
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="text-beige/70 text-sm hover:text-beige transition-colors"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-beige font-medium">Rechtliches</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/privacy"
                  className="text-beige/70 text-sm hover:text-beige transition-colors"
                >
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link
                  to="/imprint"
                  className="text-beige/70 text-sm hover:text-beige transition-colors"
                >
                  Impressum
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-beige/70 text-sm hover:text-beige transition-colors"
                >
                  AGB
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-beige font-medium">Kontakt</h4>
            <p className="text-beige/70 text-sm">
              Fragen? Schreib uns eine E-Mail:
            </p>
            <a
              href="mailto:info@betclever.de"
              className="text-beige hover:underline text-sm"
            >
              info@betclever.de
            </a>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border/40 text-center">
          <p className="text-beige/50 text-sm">
            © {currentYear} BETCLEVER. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
