import { Clock, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import { PATHS } from "../../navigation/paths";

export function Footer() {
  const { t } = useLanguage();
  const f = t.footer;

  return (
    <footer className="border-t border-white/15 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-semibold">TimeLink</span>
            </div>
            <p className="mb-4 max-w-md text-indigo-100/90">
              {f.tagline}
            </p>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition-colors duration-200 hover:bg-blue-500"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition-colors duration-200 hover:bg-sky-400"
                aria-label="Twitter / X"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition-colors duration-200 hover:bg-pink-500"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition-colors duration-200 hover:bg-indigo-600"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-medium text-white">{f.quickLinks}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to={PATHS.about}
                  className="text-indigo-100/90 transition-colors duration-200 hover:text-white"
                >
                  {f.aboutUs}
                </Link>
              </li>
              <li>
                <Link
                  to={PATHS.contact}
                  className="text-indigo-100/90 transition-colors duration-200 hover:text-white"
                >
                  {f.contactUs}
                </Link>
              </li>
              <li>
                <Link
                  to={PATHS.faq}
                  className="text-indigo-100/90 transition-colors duration-200 hover:text-white"
                >
                  {f.faq}
                </Link>
              </li>
              <li>
                <Link
                  to={PATHS.howItWorks}
                  className="text-indigo-100/90 transition-colors duration-200 hover:text-white"
                >
                  {f.howItWorks}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-medium text-white">{f.legal}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to={PATHS.privacy}
                  className="text-indigo-100/90 transition-colors duration-200 hover:text-white"
                >
                  {f.privacy}
                </Link>
              </li>
              <li>
                <Link
                  to={PATHS.terms}
                  className="text-indigo-100/90 transition-colors duration-200 hover:text-white"
                >
                  {f.terms}
                </Link>
              </li>
              <li>
                <Link
                  to={PATHS.policyCancellation}
                  className="text-indigo-100/90 transition-colors duration-200 hover:text-white"
                >
                  {f.cancellationPolicy}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8 text-center text-indigo-200/80">
          <p>
            &copy; {new Date().getFullYear()} {f.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
