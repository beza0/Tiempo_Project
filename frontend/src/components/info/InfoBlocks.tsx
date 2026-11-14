import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  Clock,
  GraduationCap,
  HelpCircle,
  MessageCircle,
  Scale,
  ShieldCheck,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

const ICONS: Record<string, LucideIcon> = {
  users: Users,
  clock: Clock,
  message: MessageCircle,
  star: Star,
  shield: ShieldCheck,
  scale: Scale,
  help: HelpCircle,
  book: BookOpen,
  calendar: CalendarClock,
  graduation: GraduationCap,
  alert: AlertTriangle,
};

export function InfoIcon({ name }: { name: string }) {
  const Icon = ICONS[name] ?? HelpCircle;
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/25 dark:text-blue-300">
      <Icon className="h-5 w-5" aria-hidden />
    </span>
  );
}

/** İç sayfa başlığı: ortak marka yüzeyi, tutarlı yükseklik. */
export function PageHero({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="tp-page-hero">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/85 sm:text-lg">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}

export function Section({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
      <div className="mb-8 max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h2>
        {lead ? <p className="mt-2 text-muted-foreground">{lead}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function FeatureCard({
  icon,
  title,
  text,
  to,
}: {
  icon: string;
  title: string;
  text: string;
  to?: string;
}) {
  const body = (
    <>
      <InfoIcon name={icon} />
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </>
  );
  const cls = "block h-full rounded-xl border border-border bg-card p-5 shadow-sm transition-colors";
  return to ? (
    <Link
      to={to}
      className={`${cls} hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
    >
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function CtaPanel({
  title,
  text,
  primary,
  secondary,
}: {
  title: string;
  text: string;
  primary: { label: string; to: string };
  secondary?: { label: string; to: string };
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="tp-cta-panel flex flex-col items-start gap-6 rounded-2xl p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
          <p className="mt-2 text-white/85">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to={primary.to} className="tp-btn-on-accent">
            {primary.label}
          </Link>
          {secondary ? (
            <Link to={secondary.to} className="tp-btn-secondary tp-btn-secondary--on-accent">
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
