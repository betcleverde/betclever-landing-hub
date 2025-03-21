
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ButtonBeige } from "@/components/ui/button-beige";
import { MotionCounter } from "@/components/ui/motion-counter";

const Index = () => {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="pt-32 pb-24 md:pt-40 md:pb-32 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-beige tracking-tight animate-fade-in leading-tight md:leading-tight lg:leading-tight">
              BETCLEVER – Dein Weg zu<br />garantierten Gewinnen
            </h1>
            <p className="mt-6 text-lg md:text-xl text-beige/80 max-w-3xl animate-fade-up animation-delay-200 leading-relaxed text-balance">
              Wir haben uns auf Matched Betting spezialisiert und nutzen Willkommensboni 
              von Sportwettenanbietern, um garantierte Gewinne zu erzielen. Seit über 
              drei Jahren sind wir in diesem Bereich erfolgreich und bieten dir die 
              Möglichkeit, von unserem bewährten System zu profitieren.
            </p>
            <div className="mt-12 animate-fade-up animation-delay-400">
              <Link to="/participation">
                <ButtonBeige size="lg" className="group">
                  Mehr erfahren
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </ButtonBeige>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-secondary">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-beige mb-16">
            Unsere Zahlen sprechen für sich
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <StatCard
              value={1250000}
              suffix=" €"
              title="Gesamtgewinn"
              description="Erzielt durch unser System"
            />
            <StatCard
              value={950000}
              suffix=" €"
              title="Ausgezahlte Provisionen"
              description="Direkt an unsere Affiliates"
            />
            <StatCard
              value={6000000}
              suffix=" €"
              title="Jährliche Wetteinsätze"
              description="Mit wachsender Tendenz"
            />
          </div>
        </div>
      </section>

      {/* Affiliate Program */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="glass-beige p-8 md:p-12 rounded-3xl">
            <div className="text-center mb-12">
              <h3 className="text-beige-dark uppercase text-sm font-medium tracking-wider mb-3">
                Affiliate-Programm
              </h3>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-beige">
                Deine Chance: Werde Affiliate und verdiene 10.000€+ im Monat
              </h2>
              <p className="mt-4 text-beige/80 max-w-3xl mx-auto">
                Unser System bietet jedem die Möglichkeit, als Affiliate ein monatliches 
                Einkommen von über 10.000€ zu erzielen. Der Ablauf ist einfach.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AffiliateCard
                step={1}
                title="Mitspielen & 250€ verdienen"
                description="Nimm zunächst als Mitspieler teil und erhalte dafür eine garantierte Belohnung von 250€."
              />
              <AffiliateCard
                step={2}
                title="Als Affiliate starten"
                description="Starte direkt als Affiliate und erhalte für jeden geworbenen Teilnehmer weitere 250€ Provision."
              />
              <AffiliateCard
                step={3}
                title="Regelmäßiges Einkommen"
                description="Mit nur einem geworbenen Mitspieler pro Tag sind 7.500€ monatlich möglich."
              />
              <AffiliateCard
                step={4}
                title="Netzwerk nutzen"
                description="Unsere erfolgreichsten Affiliates nutzen Netzwerke wie Schulen, Universitäten, Freundeskreis oder Social Media."
              />
            </div>

            <div className="mt-12 text-center">
              <Link to="/participation">
                <ButtonBeige variant="default" size="lg" className="group">
                  Mehr erfahren
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </ButtonBeige>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

interface StatCardProps {
  value: number;
  suffix?: string;
  title: string;
  description: string;
}

const StatCard = ({ value, suffix = "", title, description }: StatCardProps) => {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-8 flex flex-col items-center text-center transition-transform hover:scale-[1.02] hover:shadow-xl">
      <MotionCounter
        value={value}
        suffix={suffix}
        className="text-3xl md:text-4xl lg:text-5xl font-bold text-beige mb-3"
      />
      <h3 className="text-xl font-medium text-beige">{title}</h3>
      <p className="mt-2 text-beige/70 text-sm">{description}</p>
    </div>
  );
};

interface AffiliateCardProps {
  step: number;
  title: string;
  description: string;
}

const AffiliateCard = ({ step, title, description }: AffiliateCardProps) => {
  return (
    <div className="bg-card/40 backdrop-blur-sm border border-border/40 rounded-xl p-6 transition-all hover:bg-card/60">
      <div className="bg-beige/10 w-10 h-10 rounded-full flex items-center justify-center mb-4">
        <span className="text-beige font-medium">{step}</span>
      </div>
      <h3 className="text-lg font-medium text-beige mb-2">{title}</h3>
      <p className="text-beige/70 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default Index;
