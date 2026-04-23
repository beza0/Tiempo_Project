import { Card } from "../ui/card";
import { Dumbbell, Palette, Languages, Code, Music } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatTemplate } from "../../language";
import { fetchPublicSkills } from "../../api/skills";

const icons = [Dumbbell, Palette, Languages, Code, Music] as const;
const colors = [
  "from-green-400 to-emerald-600",
  "from-pink-400 to-rose-600",
  "from-blue-400 to-indigo-600",
  "from-purple-400 to-violet-600",
  "from-orange-400 to-amber-600",
] as const;
const bgColors = [
  "bg-emerald-50",
  "bg-rose-50",
  "bg-sky-50",
  "bg-violet-50",
  "bg-amber-50",
] as const;

export function CategoriesSection() {
  const { t } = useLanguage();
  const c = t.landing.categories;
  const [countsByCategory, setCountsByCategory] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    let cancelled = false;
    fetchPublicSkills()
      .then((skills) => {
        const next: Record<string, number> = {};
        for (const s of skills) {
          const key = (s.category ?? "").trim();
          if (!key) continue;
          next[key] = (next[key] ?? 0) + 1;
        }
        if (!cancelled) setCountsByCategory(next);
      })
      .catch(() => {
        if (!cancelled) setCountsByCategory({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="categories"
      className="bg-background px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl text-foreground sm:text-4xl md:text-5xl">
            {c.title}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {c.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
          {c.items.map((category, index) => {
            const Icon = icons[index];
            const n = countsByCategory[category.slug] ?? 0;
            const countLabel = formatTemplate(c.skillCountLabel, {
              n: String(n),
            });
            return (
              <Card
                key={category.slug}
                className={`group cursor-pointer rounded-2xl border border-slate-200/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:ring-1 dark:ring-white/5 ${bgColors[index]}`}
              >
                <div
                  className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${colors[index]} shadow-md transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="h-7 w-7 text-white" />
                </div>

                <h3 className="mb-1 text-lg font-medium text-slate-900">
                  {category.name}
                </h3>

                <p className="text-sm text-slate-600">{countLabel}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
