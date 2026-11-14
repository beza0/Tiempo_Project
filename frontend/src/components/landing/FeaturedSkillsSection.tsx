import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { fetchPublicSkills } from "../../api/skills";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { mapSkillDtoToBrowseCard, type BrowseSkillCardModel } from "../../lib/skillBrowseMap";
import { PATHS } from "../../navigation/paths";
import { SkillCard } from "../browse/SkillCard";

/** Ana sayfa: gerçek, yayınlanmış becerilerden bir seçki (önceden sayfada hiç gerçek içerik yoktu). */
export function FeaturedSkillsSection() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const f = t.landing.featured;
  const navigate = useNavigate();
  const [items, setItems] = useState<BrowseSkillCardModel[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPublicSkills()
      .then((rows) => {
        if (cancelled) return;
        setItems(rows.slice(0, 6).map((s) => mapSkillDtoToBrowseCard(s, t)));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="featured-title">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="featured-title" className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {f.title}
            </h2>
            <p className="mt-2 text-muted-foreground">{f.subtitle}</p>
          </div>
          <Link
            to={PATHS.browse}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline dark:text-blue-300"
          >
            {f.seeAll}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {items === null ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            {f.empty}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((skill) => (
              <SkillCard
                key={skill.id}
                title={skill.title}
                instructor={skill.instructor}
                category={skill.category}
                availability={skill.availability}
                location={skill.location}
                image={skill.image}
                coverFallbackUrl={skill.coverFallbackUrl}
                isOnline={skill.isOnline}
                isInPerson={skill.isInPerson}
                tags={skill.tags}
                showBookCta={!(user?.id && skill.ownerId === user.id)}
                onBookNow={() => navigate(PATHS.skill(skill.id))}
                onInstructorClick={() => navigate(PATHS.user(skill.ownerId))}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function FinalCtaSection() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const c = t.landing.finalCta;
  return (
    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="tp-cta-panel mx-auto flex max-w-7xl flex-col items-start gap-6 rounded-3xl p-8 sm:p-12 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{c.title}</h2>
          <p className="mt-2 text-white/85">{c.text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!isAuthenticated ? (
            <Link to={PATHS.signup} className="tp-btn-on-accent">
              {c.primary}
            </Link>
          ) : null}
          <Link to={PATHS.browse} className="tp-btn-secondary tp-btn-secondary--on-accent">
            {c.secondary}
          </Link>
        </div>
      </div>
    </section>
  );
}
