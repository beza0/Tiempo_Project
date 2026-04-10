import { Button } from "../ui/button";
import { Clock, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import type { PageType } from "../../App";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { fetchUnreadNotificationCount } from "../../api/notifications";
import { Sidebar } from "./Sidebar";

interface NavbarProps {
  onNavigate?: (page: PageType) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const { isAuthenticated, logout, token } = useAuth();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setNotifCount(0);
      return;
    }
    const load = () => {
      void fetchUnreadNotificationCount(token)
        .then((r) => setNotifCount(r.count))
        .catch(() => setNotifCount(0));
    };
    load();
    const interval = window.setInterval(load, 60_000);
    return () => window.clearInterval(interval);
  }, [isAuthenticated, token]);

  useEffect(() => {
    const mq = window.matchMedia("(width >= 80rem)");
    const onChange = () => {
      if (mq.matches) setIsMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    onChange();
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const handleNavigate = (page: PageType) => {
    if (onNavigate) {
      onNavigate(page);
      setIsMenuOpen(false);
      window.scrollTo(0, 0);
    }
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    handleNavigate("landing");
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 min-w-0 items-center justify-between gap-3">
            {/* Logo */}
            <button
              onClick={() => handleNavigate("landing")}
              className="flex shrink-0 cursor-pointer items-center gap-2 transition-opacity hover:opacity-80"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl whitespace-nowrap text-neutral-900 dark:text-foreground">
                TimeLink
              </span>
            </button>

            {/* Desktop Navigation — only wide screens; flex-nowrap in CSS (nav-xl-row) */}
            <div className="nav-xl-row min-w-0 gap-6">
              <button
                onClick={() => handleNavigate("browse")}
                className="shrink-0 whitespace-nowrap text-neutral-700 transition-colors hover:text-neutral-950 dark:text-muted-foreground dark:hover:text-foreground"
              >
                {t.nav.browseSkills}
              </button>

              {isAuthenticated && (
                <>
                  <button
                    onClick={() => handleNavigate("dashboard")}
                    className="shrink-0 whitespace-nowrap text-neutral-700 transition-colors hover:text-neutral-950 dark:text-muted-foreground dark:hover:text-foreground"
                  >
                    {t.nav.dashboard}
                  </button>
                  <button
                    onClick={() => handleNavigate("messages")}
                    className="relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-neutral-700 transition-colors hover:text-neutral-950 dark:text-muted-foreground dark:hover:text-foreground"
                  >
                    {t.nav.messages}
                    {notifCount > 0 ? (
                      <span className="inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
                        {notifCount > 99 ? "99+" : notifCount}
                      </span>
                    ) : null}
                  </button>
                  <button
                    onClick={() => handleNavigate("profile")}
                    className="shrink-0 whitespace-nowrap text-neutral-700 transition-colors hover:text-neutral-950 dark:text-muted-foreground dark:hover:text-foreground"
                  >
                    {t.nav.profile}
                  </button>
                  <button
                    onClick={() => handleNavigate("settings")}
                    className="shrink-0 whitespace-nowrap text-neutral-700 transition-colors hover:text-neutral-950 dark:text-muted-foreground dark:hover:text-foreground"
                  >
                    {t.nav.settings}
                  </button>
                </>
              )}
              <button
                onClick={() => handleNavigate("how-it-works")}
                className="shrink-0 whitespace-nowrap text-neutral-700 transition-colors hover:text-neutral-950 dark:text-muted-foreground dark:hover:text-foreground"
              >
                {t.nav.howItWorks}
              </button>
            </div>

            {/* Desktop Auth */}
            <div className="nav-xl-row shrink-0 gap-3">
              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  className="text-neutral-800 hover:text-neutral-950 dark:text-foreground dark:hover:text-foreground"
                  onClick={handleLogout}
                >
                  {t.nav.logout}
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="text-neutral-800 hover:text-neutral-950 dark:text-foreground dark:hover:text-foreground"
                    onClick={() => handleNavigate("login")}
                  >
                    {t.nav.signIn}
                  </Button>
                  <Button
                    onClick={() => handleNavigate("signup")}
                    className="whitespace-nowrap bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  >
                    {t.nav.getStarted}
                  </Button>
                </>
              )}
            </div>

            {/* Narrow screens: hamburger → sidebar */}
            <button
              type="button"
              className="nav-xl-menu-btn shrink-0 rounded-lg p-2 text-neutral-800 hover:bg-accent hover:text-neutral-950 dark:text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>

      <Sidebar
        isOpen={isMenuOpen}
        isAuthenticated={isAuthenticated}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
    </>
  );
}
