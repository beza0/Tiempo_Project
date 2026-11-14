import { Link } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import { PATHS } from "../../navigation/paths";
import { BrandLogo } from "../common/BrandLogo";

type FooterLink = { to: string; label: string };

/**
 * Sade, nötr footer: sayfa zeminiyle uyumlu, dört sütun. Sosyal medya ikonları kaldırıldı
 * (gerçek hesaba değil, facebook.com gibi genel adreslere gidiyordu). Topluluk, destek ve
 * eğitmen rehberi sayfaları ilk kez buradan erişilebilir.
 */
export function Footer() {
  const { t } = useLanguage();
  const f = t.footer;

  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: f.platform,
      links: [
        { to: PATHS.browse, label: f.browseSkills },
        { to: PATHS.howItWorks, label: f.howItWorks },
        { to: PATHS.instructorGuide, label: f.instructorGuide },
        { to: PATHS.community, label: f.community },
      ],
    },
    {
      title: f.helpTitle,
      links: [
        { to: PATHS.faq, label: f.faq },
        { to: PATHS.support, label: f.support },
        { to: PATHS.contact, label: f.contactUs },
        { to: PATHS.policyCancellation, label: f.cancellationPolicy },
      ],
    },
    {
      title: f.company,
      links: [
        { to: PATHS.about, label: f.aboutUs },
        { to: PATHS.privacy, label: f.privacy },
        { to: PATHS.terms, label: f.terms },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-card/40 px-4 py-12 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Link to={PATHS.home} className="inline-flex items-center gap-2" aria-label="Tiempos">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
                <BrandLogo className="h-7 w-7 object-contain" />
              </span>
              <span className="text-xl font-semibold tracking-tight">Tiempos</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {f.tagline}
            </p>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {f.copyright}
        </div>
      </div>
    </footer>
  );
}
