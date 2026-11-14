import { Card } from "../ui/card";
import { Handshake, Clock, Heart } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

const icons = [Handshake, Clock, Heart] as const;
const gradients = [
  "from-blue-500 to-cyan-500",
  "from-blue-600 to-blue-400",
  "from-orange-500 to-red-500",
] as const;

export function FeaturesSection() {
  const { t } = useLanguage();
  const f = t.landing.features;

  return (
    <section id="features" className="bg-muted/40 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {f.title}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {f.subtitle}
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {f.items.map((feature, index) => {
            const Icon = icons[index];
            const gradient = gradients[index];
            return (
              <Card 
                key={index}
                className="rounded-3xl border border-border/80 bg-card p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="mb-3 text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
