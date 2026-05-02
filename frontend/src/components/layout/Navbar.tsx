import { Button } from "../ui/button";
import {
  Clock,
  Menu,
  Bell,
  MessageCircle,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { PageType } from "../../App";
import { PATHS } from "../../navigation/paths";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  isNotificationUnread,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  type NotificationDto,
} from "../../api/notifications";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Sidebar } from "./Sidebar";
import { fetchMyDashboard } from "../../api/user";

function formatNavbarCreditHours(
  minutes: number | null,
  locale: string,
): string {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  return locale === "tr" ? `${h} sa` : `${h}h`;
}

/** İlk + soyad baş harfi; tek kelimede ilk iki harf. */
function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return parts[0]?.[0]?.toUpperCase() ?? "?";
}

interface NavbarProps {
  onNavigate?: (page: PageType) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const { isAuthenticated, logout, token, user } = useAuth();
  const { t, locale } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [creditMinutes, setCreditMinutes] = useState<number | null>(null);
  const [notifUnreadOnly, setNotifUnreadOnly] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);

  const loadUnread = useCallback(async () => {
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
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const bootTimer = window.setTimeout(() => {
      void loadUnread();
    }, 0);
    const interval = window.setInterval(() => void loadUnread(), 60_000);
    return () => {
      window.clearTimeout(bootTimer);
      window.clearInterval(interval);
    };
  }, [isAuthenticated, token, loadUnread]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setCreditMinutes(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const dash = await fetchMyDashboard(token);
        if (!cancelled) setCreditMinutes(dash.timeCreditMinutes);
      } catch {
        if (!cancelled) setCreditMinutes(null);
      }
    })();
    return () => {
      cancelled = true;
    };
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
      setIsProfileMenuOpen(false);
      window.scrollTo(0, 0);
    }
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
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

  const syncNotificationsFromServer = async () => {
    if (!token) return;
    try {
      const list = await fetchNotifications(token);
      setNotifications(list);
      setNotifCount(list.filter((n) => isNotificationUnread(n)).length);
    } catch {
      void loadUnread();
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!token) return;
    setNotifCount(0);
    try {
      await markAllNotificationsRead(token);
      await syncNotificationsFromServer();
    } catch {
      void loadUnread();
    }
  };

  const navLinkClass =
    "cursor-pointer shrink-0 whitespace-nowrap rounded-md px-2 py-1.5 text-gray-600 transition-colors hover:text-gray-900 dark:text-zinc-200 dark:hover:bg-zinc-900/70 dark:hover:text-white";

  const notificationsForPopover = notifUnreadOnly
    ? notifications.filter((n) => isNotificationUnread(n))
    : notifications;
  const displayedNotifCount = isAuthenticated ? notifCount : 0;
  const profileDisplayName = user?.name?.trim() ?? "";

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-[color:var(--border)] dark:bg-[color-mix(in_oklab,var(--background),black_14%)] dark:backdrop-blur-none dark:shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 min-w-0 items-center justify-between gap-3">
            {/* Logo */}
            <button
              onClick={() => handleNavigate("landing")}
              className="flex shrink-0 cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 transition-opacity hover:opacity-80"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl whitespace-nowrap text-gray-900 dark:text-zinc-50">
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
                </>
              )}
              <button
                onClick={() => handleNavigate("how-it-works")}
                className={navLinkClass}
              >
                {t.nav.howItWorks}
              </button>
            </div>

            {/* Auth cluster: bell outside nav-xl-row so it stays next to hamburger on narrow screens */}
            <div className="flex shrink-0 items-center gap-3 sm:gap-2 md:gap-3 pl-2 pr-[max(0.75rem,env(safe-area-inset-right))] sm:pl-1 sm:pr-[max(0rem,env(safe-area-inset-right))]">
              {isAuthenticated ? (
                <>
                <Popover
                  modal={false}
                  open={notifOpen}
                  onOpenChange={(open) => {
                    setNotifOpen(open);
                    if (open) setIsProfileMenuOpen(false);
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="nav-notification-bell-btn relative z-30 inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-gray-700 transition hover:bg-gray-200 dark:bg-muted dark:text-foreground dark:hover:bg-accent sm:mx-1"
                      aria-label={t.nav.notifications}
                    >
                      <Bell className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-semibold tabular-nums">
                        {displayedNotifCount > 99 ? "99+" : displayedNotifCount}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    side="bottom"
                    sideOffset={8}
                    collisionPadding={20}
                    className="nav-notification-popover overflow-hidden rounded-2xl border border-border bg-popover p-0 text-popover-foreground shadow-2xl"
                  >
                    <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-lg font-semibold text-foreground">
                        {t.nav.notifications}
                      </h2>
                      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
                          <input
                            type="checkbox"
                            checked={notifUnreadOnly}
                            onChange={() => setNotifUnreadOnly((u) => !u)}
                            className="h-3.5 w-3.5 rounded border-purple-300 text-purple-600 focus:ring-purple-500 dark:border-zinc-500 dark:bg-zinc-900"
                          />
                          {t.notificationsPage.unreadOnly}
                        </label>
                        <button
                        type="button"
                        className="text-sm font-medium text-purple-600 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-purple-400 dark:hover:text-purple-300"
                        disabled={
                          notifications.length === 0 ||
                          !notifications.some((n) => isNotificationUnread(n))
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void handleMarkAllNotificationsRead();
                        }}
                      >
                        {t.nav.markAllRead}
                      </button>
                      </div>
                    </div>
                    <div className="nav-notification-scroll max-h-[min(440px,calc(100dvh-10rem))]">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500 dark:text-muted-foreground">
                          {t.nav.noNotifications}
                        </p>
                      ) : notificationsForPopover.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500 dark:text-muted-foreground">
                          {t.notificationsPage.emptyUnreadFilter}
                        </p>
                      ) : (
                        notificationsForPopover.map((n) => {
                          const unread = isNotificationUnread(n);
                          return (
                            <div
                              key={n.id}
                              className={`border-b border-border p-4 transition-colors last:border-b-0 ${
                                unread
                                  ? "border-l-[5px] border-l-purple-600 bg-background"
                                  : "border-l-[5px] border-l-transparent bg-muted/30"
                              }`}
                            >
                              <div
                                role={n.exchangeRequestId ? "button" : undefined}
                                tabIndex={n.exchangeRequestId ? 0 : undefined}
                                className={
                                  n.exchangeRequestId
                                    ? "w-full cursor-pointer text-left outline-none"
                                    : "w-full text-left"
                                }
                                onClick={() =>
                                  n.exchangeRequestId
                                    ? void goToExchangeMessages(n.exchangeRequestId)
                                    : undefined
                                }
                                onKeyDown={
                                  n.exchangeRequestId
                                    ? (ev) => {
                                        if (ev.key === "Enter" || ev.key === " ") {
                                          ev.preventDefault();
                                          void goToExchangeMessages(n.exchangeRequestId);
                                        }
                                      }
                                    : undefined
                                }
                              >
                                <div className="mb-2 flex items-start justify-between gap-2">
                                  <h3
                                    className={
                                      unread
                                        ? "font-bold text-gray-900 dark:text-foreground"
                                        : "font-medium text-gray-400 dark:text-muted-foreground"
                                    }
                                  >
                                    {n.title}
                                  </h3>
                                  <span
                                    className={`shrink-0 whitespace-nowrap text-xs ${
                                      unread
                                        ? "text-gray-500 dark:text-muted-foreground"
                                        : "text-gray-400 dark:text-muted-foreground/90"
                                    }`}
                                  >
                                    {new Date(n.createdAt).toLocaleString(
                                      locale === "tr" ? "tr-TR" : "en-US",
                                      { dateStyle: "short", timeStyle: "short" },
                                    )}
                                  </span>
                                </div>
                                {n.skillTitle ? (
                                  <p
                                    className={`mb-2 text-sm ${
                                      unread
                                        ? "font-medium text-purple-600 dark:text-purple-400"
                                        : "font-medium text-purple-400/45 dark:text-purple-400/35"
                                    }`}
                                  >
                                    {n.skillTitle}
                                  </p>
                                ) : null}
                                <p
                                  className={`mb-3 text-sm leading-relaxed ${
                                    unread
                                      ? "text-gray-700 dark:text-foreground/90"
                                      : "text-gray-400 dark:text-muted-foreground/85"
                                  }`}
                                >
                                  {n.body}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-3">
                                {n.exchangeRequestId ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      void goToExchangeMessages(n.exchangeRequestId);
                                    }}
                                    className={`inline-flex items-center gap-2 text-sm font-medium ${
                                      unread
                                        ? "text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                        : "text-purple-500/55 hover:text-purple-500/75 dark:text-purple-400/45 dark:hover:text-purple-400/65"
                                    }`}
                                  >
                                    <MessageCircle className="h-4 w-4 shrink-0" />
                                    {t.nav.goToMessages}
                                  </button>
                                ) : null}
                                {token && n.id && unread ? (
                                  <button
                                    type="button"
                                    className="relative z-10 text-sm text-gray-600 hover:text-gray-800 dark:text-muted-foreground dark:hover:text-foreground"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      void (async () => {
                                        try {
                                          await markNotificationRead(token, n.id);
                                          await syncNotificationsFromServer();
                                        } catch {
                                          void loadUnread();
                                        }
                                      })();
                                    }}
                                  >
                                    {t.nav.markRead}
                                  </button>
                                ) : null}
                                {token && n.id && !unread ? (
                                  <button
                                    type="button"
                                    className="relative z-10 text-sm text-gray-400 hover:text-gray-500 dark:text-muted-foreground/80 dark:hover:text-muted-foreground"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      void (async () => {
                                        try {
                                          await markNotificationUnread(token, n.id);
                                          await syncNotificationsFromServer();
                                        } catch {
                                          void loadUnread();
                                        }
                                      })();
                                    }}
                                  >
                                    {t.nav.markUnread}
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="border-t border-border bg-muted/20 p-3">
                      <Link
                        to={notifUnreadOnly ? `${PATHS.notifications}?unread=1` : PATHS.notifications}
                        className="block w-full rounded-lg px-3 py-2 text-center text-sm font-medium text-purple-600 transition-colors hover:bg-purple-100 hover:text-purple-700 dark:text-purple-400 dark:hover:bg-purple-500/20 dark:hover:text-purple-300"
                        onClick={() => setNotifOpen(false)}
                      >
                        {t.nav.allNotifications}
                      </Link>
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="relative z-30 flex min-w-0 max-w-full items-center gap-3">
                  <div className="flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1.5 text-white">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium tabular-nums">
                      {formatNavbarCreditHours(creditMinutes, locale)}
                    </span>
                  </div>

                  <div className="relative min-w-0 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen((open) => !open);
                        setNotifOpen(false);
                      }}
                      className="relative z-30 flex max-w-[min(100vw-12rem,280px)] min-w-0 items-center gap-2 rounded-lg px-3 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-900"
                      aria-expanded={isProfileMenuOpen}
                      aria-haspopup="menu"
                      aria-label={t.nav.profile}
                    >
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10"
                        />
                      ) : (
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[11px] font-semibold uppercase leading-none tracking-tight text-white sm:text-xs"
                          aria-hidden
                        >
                          {initialsFromName(user?.name ?? "")}
                        </span>
                      )}
                      <span className="hidden max-w-[10rem] truncate text-sm font-medium text-gray-900 sm:inline dark:text-zinc-100">
                        {profileDisplayName}
                      </span>
                    </button>

                    {isProfileMenuOpen ? (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          aria-hidden
                          onClick={() => setIsProfileMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full z-20 mt-3 w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-border bg-popover px-6 py-4 text-popover-foreground shadow-lg ring-1 ring-black/5 dark:shadow-black/50 dark:ring-white/10">
                          <div className="flex flex-col gap-3">
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 whitespace-nowrap rounded-xl py-2 text-left text-sm font-medium text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                              onClick={() => {
                                setIsProfileMenuOpen(false);
                                handleNavigate("profile");
                              }}
                            >
                              <User
                                className="h-5 w-5 shrink-0 text-muted-foreground"
                                strokeWidth={1.5}
                              />
                              {t.nav.viewProfile}
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 whitespace-nowrap rounded-xl py-2 text-left text-sm font-medium text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                              onClick={() => {
                                setIsProfileMenuOpen(false);
                                handleNavigate("settings");
                              }}
                            >
                              <Settings
                                className="h-5 w-5 shrink-0 text-muted-foreground"
                                strokeWidth={1.5}
                              />
                              {t.nav.settings}
                            </button>
                            <div className="border-t border-border" />
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 whitespace-nowrap rounded-xl py-2 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-950/45"
                              onClick={() => handleLogout()}
                            >
                              <LogOut
                                className="h-5 w-5 shrink-0 text-red-600 dark:text-red-500"
                                strokeWidth={1.5}
                                aria-hidden
                              />
                              <span className="text-red-600 dark:text-red-500">
                                {t.nav.logout}
                              </span>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
                </>
              ) : null}

              <div className="nav-xl-row shrink-0 gap-3">
                {!isAuthenticated ? (
                  <>
                    <Button
                      variant="ghost"
                      className="cursor-pointer text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      onClick={() => handleNavigate("login")}
                    >
                      {t.nav.signIn}
                    </Button>
                    <Button
                      onClick={() => handleNavigate("signup")}
                      className="cursor-pointer whitespace-nowrap bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm"
                    >
                      {t.nav.getStarted}
                    </Button>
                  </>
                ) : null}
              </div>

              {/* Narrow screens: hamburger → sidebar */}
              <button
                type="button"
                className="nav-xl-menu-btn shrink-0 rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
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
