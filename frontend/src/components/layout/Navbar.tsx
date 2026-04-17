import { Button } from "../ui/button";
import { Clock, Menu, Bell, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { PageType } from "../../App";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationRead,
  type NotificationDto,
} from "../../api/notifications";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Sidebar } from "./Sidebar";

interface NavbarProps {
  onNavigate?: (page: PageType) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const { isAuthenticated, logout, token } = useAuth();
  const { t, locale } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);

  const loadUnread = async () => {
    if (!isAuthenticated || !token) {
      setNotifCount(0);
      return;
    }
    try {
      const r = await fetchUnreadNotificationCount(token);
      setNotifCount(r.count);
    } catch {
      setNotifCount(0);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setNotifCount(0);
      return;
    }
    void loadUnread();
    const interval = window.setInterval(() => void loadUnread(), 60_000);
    return () => window.clearInterval(interval);
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!notifOpen || !token) return;
    let cancelled = false;
    const load = async () => {
      try {
        const list = await fetchNotifications(token);
        if (cancelled) return;
        setNotifications(list);
      } catch {
        if (!cancelled) {
          setNotifications([]);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [notifOpen, token]);

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

  const goToExchangeMessages = async (exchangeRequestId: string | null) => {
    if (!exchangeRequestId) return;
    try {
      sessionStorage.setItem("timelink_open_exchange", exchangeRequestId);
    } catch {
      /* ignore */
    }
    setNotifOpen(false);
    handleNavigate("messages");
  };

  const navLinkClass =
    "cursor-pointer rounded-md px-2 py-1.5 shrink-0 whitespace-nowrap text-white/90 transition-all duration-150 hover:bg-white/30 hover:text-white hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]";

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 bg-gradient-to-r from-blue-500 to-purple-600 backdrop-blur-md">
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
              <span className="text-xl whitespace-nowrap text-white">
                TimeLink
              </span>
            </button>

            {/* Desktop Navigation — only wide screens; flex-nowrap in CSS (nav-xl-row) */}
            <div className="nav-xl-row min-w-0 gap-6">
              <button
                onClick={() => handleNavigate("browse")}
                className={navLinkClass}
              >
                {t.nav.browseSkills}
              </button>

              {isAuthenticated && (
                <>
                  <button
                    onClick={() => handleNavigate("dashboard")}
                    className={navLinkClass}
                  >
                    {t.nav.dashboard}
                  </button>
                  <button
                    onClick={() => handleNavigate("messages")}
                    className={`${navLinkClass} inline-flex items-center gap-1.5`}
                  >
                    {t.nav.messages}
                  </button>
                  <button
                    onClick={() => handleNavigate("profile")}
                    className={navLinkClass}
                  >
                    {t.nav.profile}
                  </button>
                  <button
                    onClick={() => handleNavigate("settings")}
                    className={navLinkClass}
                  >
                    {t.nav.settings}
                  </button>
                </>
              )}
              <button
                onClick={() => handleNavigate("how-it-works")}
                className={navLinkClass}
              >
                {t.nav.howItWorks}
              </button>
            </div>

            {/* Desktop Auth */}
            <div className="nav-xl-row shrink-0 gap-3">
              {isAuthenticated ? (
                <>
                  <Popover open={notifOpen} onOpenChange={setNotifOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="mx-1 inline-flex h-9 items-center gap-2 rounded-lg border border-primary/30 bg-gradient-to-r from-blue-500 to-purple-600 px-3 text-white shadow-[0_6px_18px_rgba(99,102,241,0.35)] transition-all hover:brightness-105 dark:border-primary/40 dark:shadow-[0_8px_22px_rgba(88,28,135,0.45)]"
                        aria-label={t.nav.notifications}
                      >
                        <Bell className="h-4 w-4 text-white" />
                        {notifCount > 0 ? (
                          <span className="inline-flex min-w-[1.2rem] items-center justify-center rounded-full bg-white/20 px-1.5 text-[11px] font-semibold leading-none text-white ring-1 ring-white/40">
                            {notifCount > 99 ? "99+" : notifCount}
                          </span>
                        ) : null}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      className="w-[430px] rounded-xl border border-border bg-card p-0 shadow-2xl"
                    >
                      <div className="border-b border-border px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">
                          {t.nav.notifications}
                        </p>
                      </div>
                      <div className="max-h-[460px] space-y-2 overflow-y-auto p-3">
                        {notifications.length === 0 ? (
                          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                            {t.nav.noNotifications}
                          </p>
                        ) : (
                          notifications.map((n) => {
                            return (
                              <div
                                key={n.id}
                                className="rounded-lg border border-border bg-background p-3"
                              >
                                <button
                                  type="button"
                                  className="w-full text-left"
                                  onClick={() =>
                                    n.exchangeRequestId
                                      ? void goToExchangeMessages(n.exchangeRequestId)
                                      : undefined
                                  }
                                >
                                  <div className="mb-1 flex items-center justify-between gap-2">
                                  <p className="text-sm font-medium text-foreground">
                                    {n.title}
                                  </p>
                                  <span className="text-[11px] text-muted-foreground">
                                    {new Date(n.createdAt).toLocaleString(
                                      locale === "tr" ? "tr-TR" : "en-US",
                                      { dateStyle: "short", timeStyle: "short" },
                                    )}
                                  </span>
                                  </div>
                                  {n.skillTitle ? (
                                    <p className="mb-1 text-xs font-medium text-primary">
                                      {n.skillTitle}
                                    </p>
                                  ) : null}
                                  <p className="text-sm text-muted-foreground">
                                    {n.body}
                                  </p>
                                </button>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  {n.exchangeRequestId ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        void goToExchangeMessages(
                                          n.exchangeRequestId,
                                        )
                                      }
                                    >
                                      <MessageCircle className="mr-1 h-4 w-4" />
                                      {t.nav.goToMessages}
                                    </Button>
                                  ) : null}
                                  {!n.readAt && token ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        void markNotificationRead(token, n.id).then(
                                          () => void loadUnread(),
                                        )
                                      }
                                    >
                                      {t.nav.markRead}
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    className="text-white/90 hover:text-white"
                    onClick={handleLogout}
                  >
                    {t.nav.logout}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="text-white/90 hover:text-white"
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
              className="nav-xl-menu-btn shrink-0 rounded-lg p-2 text-white hover:bg-white/15 hover:text-white"
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
