import { PageLayout } from "../components/layout/PageLayout";
import { HeroSection } from "../components/landing/HeroSection";
import { FeaturesSection } from "../components/landing/FeaturesSection";
import { CategoriesSection } from "../components/landing/CategoriesSection";
import {
  FeaturedSkillsSection,
  FinalCtaSection,
} from "../components/landing/FeaturedSkillsSection";
import type { PageType } from "../App";

interface LandingPageProps {
  onNavigate?: (page: PageType) => void;
}

/**
 * Ana sayfa. "Üyelerimiz ne diyor" bölümü kaldırıldı: yorum yokken boş kalıyordu ve
 * stok fotoğraflarla sahte üye yorumu izlenimi verme riski taşıyordu. Yerine gerçek
 * becerilerden bir seçki ve kapanış çağrısı geldi.
 */
export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <PageLayout onNavigate={onNavigate}>
      <HeroSection onNavigate={onNavigate} />
      <FeaturesSection />
      <FeaturedSkillsSection />
      <CategoriesSection />
      <FinalCtaSection />
    </PageLayout>
  );
}
