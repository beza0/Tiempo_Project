import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { HeroSection } from "../components/landing/HeroSection";
import { FeaturesSection } from "../components/landing/FeaturesSection";
import { CategoriesSection } from "../components/landing/CategoriesSection";
import { TestimonialsSection } from "../components/landing/TestimonialsSection";
import type { PageType } from "../App";

interface LandingPageProps {
  onNavigate?: (page: PageType) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen">
      <Navbar onNavigate={onNavigate} />
      <HeroSection />
      <FeaturesSection />
      <CategoriesSection />
      <TestimonialsSection />
      <Footer />
    </div>
  );
}
