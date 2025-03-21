
import { useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { ButtonBeige } from "@/components/ui/button-beige";

const Participation = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-32 pb-24 bg-background">
      <div className="container mx-auto max-w-5xl px-6">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-beige mb-6 animate-fade-in">
            Einfacher Prozess
          </h1>
          <h2 className="text-xl text-beige/80 max-w-3xl mx-auto animate-fade-up animation-delay-200">
            Teilnahme & Affiliate – So funktioniert's
          </h2>
          <p className="mt-4 text-beige/70 max-w-3xl mx-auto text-balance animate-fade-up animation-delay-400">
            Werde Mitspieler und sichere dir 250€ – Steige danach direkt als Affiliate ein! 
            Wir nutzen Willkommensboni von Sportwettenanbietern, um Gewinne zu erzielen – 
            und dafür brauchen wir dich!
          </p>
        </div>

        {/* Requirements */}
        <div className="mb-20 bg-secondary border border-border/50 rounded-2xl p-8 md:p-10 animate-scale-in">
          <h3 className="text-beige text-xl font-medium mb-6">
            Voraussetzungen für die Teilnahme
          </h3>
          <ul className="space-y-4">
            <RequirementItem>Du bist zwischen 18 und 55 Jahren alt.</RequirementItem>
            <RequirementItem>Du besitzt einen deutschen Ausweis oder Reisepass.</RequirementItem>
            <RequirementItem>Du hast eine deutsche Meldeadresse.</RequirementItem>
            <RequirementItem>Du hast zuvor noch nicht an einem ähnlichen Angebot teilgenommen.</RequirementItem>
            <RequirementItem>
              Du bist bereit, für etwa einen Monat ein Bankkonto bei der Deutschen Bank zu eröffnen. 
              Falls dies nicht möglich ist, kontaktiere uns bitte.
            </RequirementItem>
          </ul>
        </div>

        {/* Steps */}
        <div className="mb-16">
          <h3 className="text-beige text-xl font-medium text-center mb-10">
            Schritt für Schritt zum Gewinn
          </h3>
          <p className="text-beige/70 text-center mb-12">
            Unser Prozess ist einfach und transparent. Folge diesen Schritten, um deine garantierten Gewinne zu sichern.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            <StepCard
              number={1}
              title="Bankkonto eröffnen"
              description="Eröffne ein Girokonto bei der Deutschen Bank, das sowohl eine Debitkarte als auch eine Kreditkarte umfasst. Wichtig: Alle anfallenden Kontoführungsgebühren werden am Ende von uns übernommen."
            />
            <StepCard
              number={2}
              title="Bestätigung und Anmeldung"
              description="Nachdem du dein Konto eröffnet hast, erhältst du die Unterlagen, Karten sowie einen QR-Code für die PushTAN-App. Sobald du alle Dokumente hast, registrierst du dich über unser Anmeldeformular. Deine Daten werden über einen verschlüsselten Anbieter vorübergehend gespeichert."
            />
            <StepCard
              number={3}
              title="WhatsApp-Bestätigung & Warteschlange"
              description="Nachdem wir deine Anmeldung erhalten haben, bekommst du eine WhatsApp-Benachrichtigung, dass du auf der Warteliste bist. Die Bearbeitung kann bis zu eine Woche dauern."
            />
            <StepCard
              number={4}
              title="Kurzes Telefonat zur Bestätigung"
              description="Sobald du an der Reihe bist, führen wir ein kurzes Telefonat, um den weiteren Ablauf zu besprechen."
            />
            <StepCard
              number={5}
              title="Durchführung & Auszahlung"
              description="Wir loggen uns in dein Bankkonto ein und überweisen dort Geld, um es bei den Buchmachern einzusetzen. Mithilfe unserer Strategie erzielen wir garantierte Gewinne. Nach etwa zwei Wochen erfolgt die Auszahlung, und du erhältst deine 250€ Gutschrift. Danach wird das Konto geschlossen, und wir übernehmen alle anfallenden Gebühren."
              colSpan={true}
            />
          </div>
        </div>

        {/* After Participation */}
        <div className="bg-beige/10 backdrop-blur-sm border border-beige/20 rounded-2xl p-8 md:p-10 text-center mb-20 animate-fade-up">
          <h3 className="text-beige text-xl font-medium mb-4">
            Nach deiner erfolgreichen Teilnahme
          </h3>
          <p className="text-beige/80 text-lg mb-8">
            Kannst du direkt als Affiliate einsteigen und durch das Werben neuer Teilnehmer 
            250€ Provision pro Anmeldung verdienen.
          </p>
          <Link to="/register">
            <ButtonBeige size="lg">
              Jetzt als Affiliate registrieren
            </ButtonBeige>
          </Link>
        </div>
      </div>
    </div>
  );
};

interface RequirementItemProps {
  children: React.ReactNode;
}

const RequirementItem = ({ children }: RequirementItemProps) => {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle className="w-5 h-5 text-beige mt-0.5 flex-shrink-0" />
      <span className="text-beige/80">{children}</span>
    </li>
  );
};

interface StepCardProps {
  number: number;
  title: string;
  description: string;
  colSpan?: boolean;
}

const StepCard = ({ number, title, description, colSpan = false }: StepCardProps) => {
  return (
    <div className={`bg-card border border-border/30 rounded-xl p-6 md:p-8 transition-all duration-300 hover:border-beige/30 hover:shadow-lg ${colSpan ? 'md:col-span-2' : ''}`}>
      <div className="flex items-start gap-5">
        <div className="bg-beige/10 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
          <span className="text-beige font-medium">{number}</span>
        </div>
        <div>
          <h4 className="text-beige font-medium text-lg mb-3">{title}</h4>
          <p className="text-beige/70 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default Participation;
