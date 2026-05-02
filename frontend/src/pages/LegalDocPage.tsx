import type { LucideIcon } from "lucide-react";
import { Scale, Shield, CalendarClock } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import type { PageType } from "../App";
import { useLanguage } from "../contexts/LanguageContext";
import "../styles/legal-doc.css";

export type LegalDocKey = "privacy" | "terms" | "policyCancellation";

const LEGAL_ICONS: Record<LegalDocKey, LucideIcon> = {
  privacy: Shield,
  terms: Scale,
  policyCancellation: CalendarClock,
};

interface LegalDocPageProps {
  pageKey: LegalDocKey;
  onNavigate?: (page: PageType) => void;
}

export function LegalDocPage({ pageKey, onNavigate }: LegalDocPageProps) {
  const { t } = useLanguage();
  const doc = t.staticSite[pageKey] as {
    title: string;
    heroSubtitle: string;
    body: string;
  };
  const Icon = LEGAL_ICONS[pageKey];

  const paragraphs = doc.body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <PageLayout onNavigate={onNavigate}>
      <div className="legal-page">
        <div className="legal-content">
          <section className="legal-hero">
            <div className="legal-hero-container">
              <div className="legal-hero-icon">
                <Icon className="icon-large" aria-hidden />
              </div>
              <h1 className="legal-hero-title">{doc.title}</h1>
              <p className="legal-hero-subtitle">{doc.heroSubtitle}</p>
            </div>
          </section>

          <section className="legal-main">
            <div className="legal-section-container">
              <div className="legal-card">
                <div className="legal-prose">
                  {paragraphs.map((p, i) => (
                    <p key={i} className="legal-paragraph">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
