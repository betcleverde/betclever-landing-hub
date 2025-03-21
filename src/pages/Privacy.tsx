
import { useEffect } from "react";

const Privacy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-beige mb-4 animate-fade-in">
            Ihre Daten in sicheren Händen
          </h1>
          <h2 className="text-xl text-beige/80 animate-fade-up animation-delay-200">
            Datenschutz & Rechtliche Grundlagen
          </h2>
        </div>

        <div className="prose prose-lg prose-invert max-w-none animate-fade-up animation-delay-400">
          <p className="text-beige/80 leading-relaxed">
            Der Schutz deiner persönlichen Daten hat für uns höchste Priorität. Wir halten uns strikt an die geltenden Datenschutzbestimmungen der Europäischen Union und Deutschlands.
          </p>

          <h3 className="text-beige text-xl font-medium mt-10 mb-5">Gesetzliche Grundlagen</h3>
          <p className="text-beige/80 leading-relaxed">
            BETCLEVER betreibt Matched Betting unter Einhaltung folgender Datenschutzvorschriften:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-beige/80">
            <li>DSGVO (EU-Verordnung 2016/679) – Regelt den Schutz personenbezogener Daten innerhalb der EU</li>
            <li>BDSG (Bundesdatenschutzgesetz) – Nationale Datenschutzrichtlinien für Deutschland</li>
            <li>TTDSG (Telekommunikation-Telemedien-Datenschutz-Gesetz) – Vorschriften für Online-Dienste und digitale Plattformen</li>
          </ul>

          <h3 className="text-beige text-xl font-medium mt-10 mb-5">Welche Daten erfassen wir?</h3>
          <p className="text-beige/80 leading-relaxed">
            Um eine sichere und effiziente Teilnahme an unserem Programm zu ermöglichen, erfassen wir folgende personenbezogene Daten:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-beige/80">
            <li>Persönliche Angaben: Name, Geburtsdatum, Adresse, Staatsangehörigkeit</li>
            <li>Kontaktinformationen: E-Mail-Adresse, Telefonnummer</li>
            <li>Zahlungsdetails: Bankverbindung zur Auszahlung deiner Gewinne</li>
            <li>Technische Daten: IP-Adresse, verwendeter Browser, besuchte Seiten auf unserer Plattform</li>
          </ul>

          <h3 className="text-beige text-xl font-medium mt-10 mb-5">Warum erfassen wir diese Daten?</h3>
          <p className="text-beige/80 leading-relaxed">
            Die Verarbeitung deiner Daten erfolgt ausschließlich zu folgenden Zwecken:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-beige/80">
            <li>Sicherstellung eines reibungslosen Ablaufs beim Matched Betting</li>
            <li>Verwaltung und Auszahlung von Gewinnen sowie Affiliate-Provisionen</li>
            <li>Einhaltung gesetzlicher Vorschriften und steuerrechtlicher Verpflichtungen</li>
            <li>Verbesserung unserer Plattform für eine optimale Nutzererfahrung</li>
          </ul>

          <h3 className="text-beige text-xl font-medium mt-10 mb-5">Sicherheit & Speicherung deiner Daten</h3>
          <p className="text-beige/80 leading-relaxed">
            Wir setzen auf modernste Sicherheitsstandards, um deine Daten bestmöglich zu schützen:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-beige/80">
            <li>Ende-zu-Ende-Verschlüsselung – Höchster Schutz bei der Datenübertragung</li>
            <li>Server in Deutschland – Strenge Datenschutzvorgaben garantiert</li>
            <li>Strenge Zugriffsbeschränkungen – Nur autorisierte Mitarbeiter haben Zugang zu sensiblen Daten</li>
          </ul>

          <h3 className="text-beige text-xl font-medium mt-10 mb-5">Deine Rechte</h3>
          <p className="text-beige/80 leading-relaxed">
            Gemäß den Datenschutzgesetzen hast du das Recht auf:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-beige/80">
            <li>Auskunft: Du kannst eine Kopie deiner gespeicherten Daten anfordern.</li>
            <li>Berichtigung: Falls Daten fehlerhaft sind, kannst du deren Korrektur verlangen.</li>
            <li>Löschung: In bestimmten Fällen kannst du die Löschung deiner Daten beantragen.</li>
            <li>Einschränkung der Verarbeitung: Falls eine Löschung nicht möglich ist, kannst du die Verarbeitung einschränken.</li>
            <li>Widerspruch: Du kannst der Verarbeitung deiner Daten jederzeit widersprechen.</li>
          </ul>

          <p className="text-beige/80 leading-relaxed mt-8">
            Falls du Fragen hast oder deine Rechte geltend machen möchtest, kontaktiere uns jederzeit unter <a href="mailto:datenschutz@betclever.de" className="text-beige hover:underline">datenschutz@betclever.de</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
