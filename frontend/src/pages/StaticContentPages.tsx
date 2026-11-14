import type { PageType } from "../App";
import { LegalDocPage } from "./LegalDocPage";



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

