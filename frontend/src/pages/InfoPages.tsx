import { Link } from "react-router-dom";
import { PageLayout } from "../components/layout/PageLayout";
import {
  CtaPanel,
  FeatureCard,
  InfoIcon,
  PageHero,
  Section,
} from "../components/info/InfoBlocks";
import { useLanguage } from "../contexts/LanguageContext";
import type { PageType } from "../App";
import { PATHS, pageToPath } from "../navigation/paths";

type NavProps = { onNavigate?: (page: PageType) => void };

export function CommunityPage({ onNavigate }: NavProps) {
  const { t } = useLanguage();
  const c = t.infoPages.community;
  return (
    <PageLayout onNavigate={onNavigate}>
      <PageHero title={c.heroTitle} subtitle={c.heroSubtitle} />
      <Section title={c.sectionTitle} lead={c.sectionLead}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.items.map((it) => (
            <FeatureCard key={it.title} icon={it.icon} title={it.title} text={it.text} />
          ))}
        </div>
      </Section>
      <CtaPanel
        title={c.ctaTitle}
        text={c.ctaText}
        primary={{ label: c.ctaPrimary, to: PATHS.addSkill }}
        secondary={{ label: c.ctaSecondary, to: PATHS.browse }}
      />
    </PageLayout>
  );
}

export function SupportPage({ onNavigate }: NavProps) {
  const { t } = useLanguage();
  const s = t.infoPages.support;
  return (
    <PageLayout onNavigate={onNavigate}>
      <PageHero title={s.heroTitle} subtitle={s.heroSubtitle} />
      <Section title={s.quickTitle}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {s.quickLinks.map((q) => (
            <FeatureCard
              key={q.title}
              icon={q.icon}
              title={q.title}
              text={q.text}
              to={pageToPath(q.page as PageType)}
            />
          ))}
        </div>
      </Section>
      <Section title={s.topicsTitle}>
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {s.topics.map((tp) => (
            <details key={tp.q} className="group px-5 py-4 open:bg-muted/30">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-foreground marker:hidden">
                {tp.q}
                <span
                  className="text-muted-foreground transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tp.a}</p>
            </details>
          ))}
        </div>
      </Section>
      <CtaPanel
        title={s.contactTitle}
        text={s.contactText}
        primary={{ label: s.contactButton, to: PATHS.contact }}
      />
    </PageLayout>
  );
}

export function InstructorGuidePage({ onNavigate }: NavProps) {
  const { t } = useLanguage();
  const g = t.infoPages.instructorGuide;
  return (
    <PageLayout onNavigate={onNavigate}>
      <PageHero title={g.heroTitle} subtitle={g.heroSubtitle} />
      <Section title={g.stepsTitle}>
        <ol className="relative space-y-4">
          {g.steps.map((st, i) => (
            <li
              key={st.title}
              className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                aria-hidden
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold text-foreground">{st.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{st.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>
      <Section title={g.rulesTitle}>
        <div className="grid gap-4 md:grid-cols-3">
          {g.rules.map((r) => (
            <FeatureCard key={r.title} icon={r.icon} title={r.title} text={r.text} />
          ))}
        </div>
      </Section>
      <CtaPanel
        title={g.ctaTitle}
        text={g.ctaText}
        primary={{ label: g.ctaPrimary, to: PATHS.addSkill }}
      />
    </PageLayout>
  );
}

export function NotFoundPage({ onNavigate }: NavProps) {
  const { t } = useLanguage();
  const n = t.infoPages.notFound;
  return (
    <PageLayout onNavigate={onNavigate}>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-32 text-center">
        <InfoIcon name="help" />
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-primary dark:text-blue-300">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{n.title}</h1>
        <p className="mt-3 text-muted-foreground">{n.text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to={PATHS.home}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {n.home}
          </Link>
          <Link
            to={PATHS.browse}
            className="inline-flex h-10 items-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            {n.browse}
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
