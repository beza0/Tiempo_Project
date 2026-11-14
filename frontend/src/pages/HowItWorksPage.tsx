import { PageLayout } from "../components/layout/PageLayout";
import type { PageType } from "../App";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  UserPlus,
  Search,
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

const stepIcons = [UserPlus, Search, BookOpen, Award] as const;

interface HowItWorksPageProps {
  onNavigate?: (page: PageType) => void;
}

export function HowItWorksPage({ onNavigate }: HowItWorksPageProps) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const h = t.howItWorks;

  return (
    <PageLayout onNavigate={onNavigate}>
      
      <div className="tp-page-hero">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl text-white mb-6">
            {h.heroTitle}
          </h1>
          <p className="text-xl text-white/90 mb-8">
            {h.heroSubtitle}
          </p>
          {!isAuthenticated ? (
            <Button
              size="lg"
              className="tp-hero-primary rounded-full px-8 py-6 shadow-xl"
              onClick={() => onNavigate?.("signup")}
            >
              {h.getStartedFree}
            </Button>
          ) : null}
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-3xl text-foreground sm:text-4xl">
            {h.stepsTitle}
          </h2>
          <p className="text-lg text-muted-foreground">
            {h.stepsSubtitle}
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {h.steps.map((step, index) => {
            const Icon = stepIcons[index];
            const gradients = [
              "from-blue-500 to-cyan-500",
              "from-blue-600 to-blue-400",
              "from-orange-500 to-red-500",
              "from-green-500 to-emerald-500",
            ] as const;

            return (
              <div key={index} className="h-full">
                <Card className="h-full rounded-2xl border border-border p-7 shadow-sm">
                  <div className="mb-5 flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradients[index]} shadow-md`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-3xl font-semibold tabular-nums text-muted-foreground/50">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mb-2 text-xl font-semibold text-foreground">{step.title}</h3>

                  <p className="text-muted-foreground">{step.description}</p>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="bg-background py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="mb-6 text-3xl text-foreground">
                {h.creditsTitle}
              </h2>
              <p className="mb-6 text-lg text-muted-foreground">
                {h.creditsIntro}
              </p>
              
              <div className="space-y-4">
                <Card className="gap-0 rounded-xl border border-blue-500/25 bg-blue-500/[0.12] p-4 text-card-foreground shadow-sm dark:border-blue-500/35 dark:bg-blue-950/55">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{h.teachHour}</p>
                      <p className="text-sm text-muted-foreground">{h.teachHourSub}</p>
                    </div>
                  </div>
                </Card>

                <Card className="gap-0 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{h.learnHour}</p>
                      <p className="text-sm text-muted-foreground">{h.learnHourSub}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            
            <Card className="p-8 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 border-0 shadow-2xl text-white">
              <h3 className="text-2xl mb-4">{h.bonusTitle}</h3>
              <div className="text-6xl mb-4">🎁</div>
              <p className="text-xl mb-2">{h.bonusCredits}</p>
              <p className="text-white/80 mb-6">
                {h.bonusDesc}
              </p>
              {!isAuthenticated ? (
                <Button
                  className="tp-btn-on-accent w-full"
                  onClick={() => onNavigate?.("signup")}
                >
                  {h.claimBonus}
                </Button>
              ) : null}
            </Card>
          </div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-3xl text-foreground sm:text-4xl">
            {h.whyTitle}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {h.benefits.map((benefit, index) => (
            <Card key={index} className="rounded-xl border border-border p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-green-500" />
                <p className="text-foreground/90">{benefit}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="bg-muted/50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="mb-4 text-3xl text-foreground sm:text-4xl">
              {h.faqTitle}
            </h2>
          </div>
          
          <div className="space-y-4">
            {h.faqs.map((faq, index) => (
              <Card key={index} className="rounded-2xl border-0 p-6 shadow-lg">
                <h3 className="mb-2 text-lg text-foreground">
                  {faq.q}
                </h3>
                <p className="text-muted-foreground">
                  {faq.a}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl text-white mb-6">
            {h.ctaTitle}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            {h.ctaSubtitle}
          </p>
          {!isAuthenticated ? (
            <Button
              size="lg"
              className="tp-hero-primary rounded-full px-8 py-6 shadow-xl"
              onClick={() => onNavigate?.("signup")}
            >
              {h.ctaButton}
            </Button>
          ) : null}
        </div>
      </div>
    </PageLayout>
  );
}
