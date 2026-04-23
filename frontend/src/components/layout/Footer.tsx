import { Clock, Facebook, Twitter, Instagram, Linkedin, Mail } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

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
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition-colors duration-200 hover:bg-blue-500"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition-colors duration-200 hover:bg-sky-400"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition-colors duration-200 hover:bg-pink-500"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
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
                <a
                  href="#"
                  className="text-indigo-100/90 transition-colors duration-200 hover:text-white"
                >
                  {f.aboutUs}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-indigo-100/90 transition-colors duration-200 hover:text-white"
                >
                  {f.howItWorks}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-indigo-100/90 transition-colors duration-200 hover:text-white"
                >
                  {f.categories}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-indigo-100/90 transition-colors duration-200 hover:text-white"
                >
                  {f.community}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-medium text-white">{f.legal}</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-indigo-100/90 transition-colors duration-200 hover:text-white"
                >
                  {f.privacy}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-indigo-100/90 transition-colors duration-200 hover:text-white"
                >
                  {f.terms}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-indigo-100/90 transition-colors duration-200 hover:text-white"
                >
                  {f.contact}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-2 text-indigo-100/90 transition-colors duration-200 hover:text-white"
                >
                  <Mail className="h-4 w-4" />
                  {f.support}
                </a>
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
