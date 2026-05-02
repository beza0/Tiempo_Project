import { PageLayout } from "../components/layout/PageLayout";
import { Card } from "../components/ui/card";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import type { PageType } from "../App";
import type { Translation } from "../language/locale/en";
import { PATHS } from "../navigation/paths";
import { LegalDocPage } from "./LegalDocPage";

type StaticKey = Exclude<
  keyof Translation["staticSite"],
  "about" | "contact"
>;

function GenericStaticPage({
  pageKey,
  onNavigate,
}: {
  pageKey: StaticKey;
  onNavigate?: (page: PageType) => void;
}) {
  const { t } = useLanguage();
  const c = t.staticSite[pageKey];
  return (
    <PageLayout onNavigate={onNavigate}>
      <div className="mx-auto max-w-3xl px-4 pb-12 pt-20 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-foreground">{c.title}</h1>
        <Card className="p-6 shadow-md">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground sm:text-base">
            {c.body}
          </p>
        </Card>
        <p className="mt-8 text-sm text-muted-foreground">
          <Link
            to={PATHS.home}
            className="text-primary underline-offset-4 hover:underline"
          >
            ←
          </Link>
        </p>
      </div>
    </PageLayout>
  );
}

export function CommunityPage({
  onNavigate,
}: {
  onNavigate?: (page: PageType) => void;
}) {
  return <GenericStaticPage pageKey="community" onNavigate={onNavigate} />;
}

export function SupportPage({
  onNavigate,
}: {
  onNavigate?: (page: PageType) => void;
}) {
  return <GenericStaticPage pageKey="support" onNavigate={onNavigate} />;
}

export function TermsPage({
  onNavigate,
}: {
  onNavigate?: (page: PageType) => void;
}) {
  return <LegalDocPage pageKey="terms" onNavigate={onNavigate} />;
}

export function PrivacyPage({
  onNavigate,
}: {
  onNavigate?: (page: PageType) => void;
}) {
  return <LegalDocPage pageKey="privacy" onNavigate={onNavigate} />;
}

export function CancellationPolicyPage({
  onNavigate,
}: {
  onNavigate?: (page: PageType) => void;
}) {
  return (
    <LegalDocPage pageKey="policyCancellation" onNavigate={onNavigate} />
  );
}

export function InstructorGuidePage({
  onNavigate,
}: {
  onNavigate?: (page: PageType) => void;
}) {
  return (
    <GenericStaticPage pageKey="instructorGuide" onNavigate={onNavigate} />
  );
}
