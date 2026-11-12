import { PageLayout } from "../components/layout/PageLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { cn } from "../components/ui/utils";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "../components/ui/modal";
import {
  ArrowLeft,
  Search,
  Send,
  Check,
  X,
  MessageCircle,
  CalendarPlus,
  CalendarIcon,
  AlertTriangle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync, createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import type { PageType } from "../App";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { formatTemplate } from "../language";
import { enUS, tr as trLocale } from "react-day-picker/locale";
import {
  acknowledgeOwnerAttendance,
  acknowledgeRequesterAttendance,
  acceptExchangeRequest,
  cancelExchangeRequest,
  createCounterOffer,
  createRequesterCounterOffer,
  fetchExchangeMessages,
  fetchReceivedExchangeRequests,
  fetchSentExchangeRequests,
  postExchangeMessage,
  rejectExchangeRequest,
  createExchangeRequest,
  type ExchangeMessageDto,
} from "../api/exchange";
import { fetchSkillById, type SkillDto } from "../api/skills";
import { ApiError, apiErrorDisplayMessage } from "../api/client";
import {
  blockUser,
  fetchMyBlockState,
  fetchMyProfile,
  fetchPublicUserProfile,
  type PublicUserProfileDto,
  unblockUser,
} from "../api/user";
import {
  fetchNotifications,
  isNotificationUnread,
  markNotificationRead,
} from "../api/notifications";
import { useBookingAvailabilityFromSkill } from "../hooks/useBookingAvailabilityFromSkill";
import {
  BOOKING_HORIZON_DAYS,
  buildSkillTimeOptionsForDate,
  dateToYmd,
  hasSkillAvailabilityConstraints,
  isWithinSkillAvailability,
} from "../lib/bookingAvailability";
import { initialsFromFullName } from "../lib/initials";
import { PATHS } from "../navigation/paths";
import {
  canCancelExchange,
  findExchangeInRows,
  firstBookableDefaultStartIso,
  tomorrowDateStr,
  formatScheduledAt,
  getOtherUserId,
  isInitialMessageFromMe,
  isMessageEnabledStatus,
  isPendingExchangeStatus,
  isRequesterSkillBookingSide,
  localDateTimeToUtcIso,
  mergeExchanges,
  normalizeExchangeStatus,
  sameUserId,
  toUiStatus,
  ymdToLocalDate,
  type ConversationRow,
  type UiStatus,
} from "./messages/exchangeHelpers";

interface MessagesPageProps {
  onNavigate?: (page: PageType) => void;
  /** Sohbet başlığındaki isim/avatar: karşıdaki üyenin herkese açık profil sayfası */
  onViewUserProfile?: (userId: string) => void;
}

const OPEN_EXCHANGE_KEY = "tiempos_open_exchange";
const OPEN_USER_KEY = "tiempos_open_user";
const OPEN_SKILL_KEY = "tiempos_open_skill";

const INBOX_WIDTH_STORAGE_KEY = "tiempos_messages_inbox_width_px";
const DEFAULT_INBOX_WIDTH_PX = 384;
const MIN_INBOX_WIDTH_PX = 220;
const MIN_CHAT_PANE_WIDTH_PX = 260;
const MAX_INBOX_WIDTH_PX = 560;

function readStoredInboxWidthPx(): number {
  try {
    const v = localStorage.getItem(INBOX_WIDTH_STORAGE_KEY);
    const n = v ? parseInt(v, 10) : NaN;
    if (!Number.isFinite(n)) return DEFAULT_INBOX_WIDTH_PX;
    return Math.min(MAX_INBOX_WIDTH_PX, Math.max(MIN_INBOX_WIDTH_PX, n));
  } catch {
    return DEFAULT_INBOX_WIDTH_PX;
  }
}

type MessagesLocationState = {
  tiemposOpenChat?: { userId?: string; skillId?: string };
};

/** Mesajlar route'una gelirken açılacak sohbet / taslak (session + URL). */
type MessagesRouteOpenIntent = {
  userId: string | null;
  skillId: string | null;
  exchangeId: string | null;
};

function clearStoredOpenNavIntent() {
  try {
    sessionStorage.removeItem(OPEN_USER_KEY);
    sessionStorage.removeItem(OPEN_SKILL_KEY);
  } catch {
    /* ignore */
  }
}

/** Her /messages girişinde senkron okunur (SkillDetail session + adres çubuğu). */
function readMessagesRouteBootstrap(): {
  userId: string | null;
  skillId: string | null;
  exchangeId: string | null;
} {
  let userId: string | null = null;
  let skillId: string | null = null;
  let exchangeId: string | null = null;
  try {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      userId = sp.get("user")?.trim() || null;
      skillId = sp.get("skill")?.trim() || null;
      exchangeId = sp.get("open")?.trim() || null;
    }
  } catch {
    /* ignore */
  }
  try {
    userId = userId || sessionStorage.getItem(OPEN_USER_KEY)?.trim() || null;
    skillId = skillId || sessionStorage.getItem(OPEN_SKILL_KEY)?.trim() || null;
    const ex = sessionStorage.getItem(OPEN_EXCHANGE_KEY)?.trim();
    if (ex) {
      exchangeId = exchangeId || ex;
      sessionStorage.removeItem(OPEN_EXCHANGE_KEY);
    }
  } catch {
    /* ignore */
  }
  return { userId, skillId, exchangeId };
}

type ThreadLine = {
  id: string;
  kind: "message" | "offer-card";
  sender: "me" | "other";
  text?: string;
  offerStatus?: UiStatus;
  offerSkillTitle?: string;
  offerScheduledAt?: string | null;
  offerMinutes?: number;
  timeLabel: string;
  sortMs: number;
};

export function MessagesPage({ onNavigate, onViewUserProfile }: MessagesPageProps) {
  const { t, locale } = useLanguage();
  const m = t.messagesPage;
  const sd = t.skillDetail;
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, patchUser } = useAuth();
  const [resolvedMyUserId, setResolvedMyUserId] = useState<string | null>(null);
  const effectiveMyUserId = user?.id ?? resolvedMyUserId;
  /** Oturum var ama UUID henüz yok: mergeExchanges yanlış otherUserId üretir; listeyi beklet */
  const listAwaitingMyId = Boolean(token && !effectiveMyUserId);
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  /** State bir frame gecikebilir; open-from-nav ile loadList yarışını önlemek için senkron ref. */
  const loadingListRef = useRef(false);
  /** Yeni konuşma taslağı yüklenirken effect 922'nin seçimi silmesini engeller */
  const pendingOpenNewChatUserLowerRef = useRef<string | null>(null);
  /** rows güncellenince aynı user+skill için ikinci bir fetch başlatılmasını engeller */
  const openInstructorIntentFlightRef = useRef<string | null>(null);
  const [selectedOtherUserId, setSelectedOtherUserId] = useState<string | null>(
    null,
  );
  const [activeExchangeId, setActiveExchangeId] = useState<string | null>(null);
  const [routeOpenIntent, setRouteOpenIntent] = useState<MessagesRouteOpenIntent>(
    () => readMessagesRouteBootstrap(),
  );
  const [newThreadDraft, setNewThreadDraft] = useState<{
    otherUserId: string;
    otherName: string;
    skill: SkillDto;
  } | null>(null);
  const [draftFirstMessage, setDraftFirstMessage] = useState("");
  const [draftSubmitting, setDraftSubmitting] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [blockedByUserIds, setBlockedByUserIds] = useState<string[]>([]);
  const [userAvatarById, setUserAvatarById] = useState<Record<string, string>>({});
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [inboxWidthPx, setInboxWidthPx] = useState(readStoredInboxWidthPx);
  const [splitPaneDragging, setSplitPaneDragging] = useState(false);
  const [isSmViewport, setIsSmViewport] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 640px)").matches,
  );
  const splitLayoutRef = useRef<HTMLDivElement | null>(null);
  const splitDragWidthRef = useRef(readStoredInboxWidthPx());
  const [threadLines, setThreadLines] = useState<ThreadLine[]>([]);
  const threadScrollRef = useRef<HTMLDivElement | null>(null);
  /** Dar ekranda geri ile sohbet panelini kapattıysa, listeyi tekrar doldurunca ilk satırı yeniden otomatik seçme */
  const userClosedConversationPaneRef = useRef(false);
  const [loadingThread, setLoadingThread] = useState(false);
  /** Mesaj gönderme / kabul-red vb.; rezervasyon modalı `bookError` kullanır (karışmasın). */
  const [chatActionError, setChatActionError] = useState<string | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const [bookDate, setBookDate] = useState(() => tomorrowDateStr());
  const [bookTime, setBookTime] = useState("10:00");
  const [bookMessage, setBookMessage] = useState("");
  const [bookSubmitting, setBookSubmitting] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  /** Overlay kapanmasını anında doğru engellemek için (closure’da bookError gecikmesi olmasın). */
  const bookErrorRef = useRef<string | null>(null);
  /** State bir sonraki paint’e kadar gecikebilir; kapanmayı engellemek için ref kullan. */
  const bookSubmittingRef = useRef(false);
  bookErrorRef.current = bookError;
  const [bookDatePopoverOpen, setBookDatePopoverOpen] = useState(false);
  const [bookCalendarMonth, setBookCalendarMonth] = useState<Date>(() =>
    ymdToLocalDate(tomorrowDateStr()),
  );
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [blockConfirmPending, setBlockConfirmPending] = useState(false);
  /**
   * Modal açılmadan önce `/api/users/me/profile` ile tamamlanan kullanıcı id (öğrenci müsaitlik dalı).
   * Oturumda `user.id` eksikse refuse-and-offer sonrası reddedilmiş talepte bile talep sahibi doğru seçilir.
   */
  const [bookingModalUserId, setBookingModalUserId] = useState<string | null>(
    null,
  );

  const bookDateMin = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const bookDateMax = useMemo(() => {
    const d = new Date(bookDateMin);
    d.setDate(d.getDate() + BOOKING_HORIZON_DAYS);
    return d;
  }, [bookDateMin]);

  const loadList = useCallback(async (): Promise<ConversationRow[]> => {
    if (!token) {
      loadingListRef.current = false;
      setRows([]);
      return [];
    }
    loadingListRef.current = true;
    setLoadingList(true);
    try {
      const [sent, received] = await Promise.all([
        fetchSentExchangeRequests(token),
        fetchReceivedExchangeRequests(token),
      ]);
      const next = mergeExchanges(
        sent,
        received,
        effectiveMyUserId ?? undefined,
      );
      setRows(next);
      return next;
    } catch {
      setRows([]);
      return [];
    } finally {
      loadingListRef.current = false;
      setLoadingList(false);
    }
  }, [token, effectiveMyUserId]);

  const selected = useMemo(() => {
    if (!selectedOtherUserId) return null;
    const sid = selectedOtherUserId.trim().toLowerCase();
    const row =
      rows.find(
        (r) => r.otherUserId.trim().toLowerCase() === sid,
      ) ?? null;
    if (!row) return null;
    const ex =
      row.exchanges.find(
        (e) =>
          activeExchangeId &&
          e.id.toLowerCase() === activeExchangeId.toLowerCase(),
      ) ??
      row.exchanges[0] ??
      null;
    if (!ex) return null;
    return {
      row,
      ex,
      otherName: row.otherName,
      uiStatus: toUiStatus(ex, effectiveMyUserId ?? undefined),
    };
  }, [rows, selectedOtherUserId, activeExchangeId, effectiveMyUserId]);

  const composerAllowsSend = useMemo(() => {
    if (!selected) return false;
    return (
      isMessageEnabledStatus(selected.ex.status) ||
      (isPendingExchangeStatus(selected.ex.status) &&
        (Boolean(selected.ex.pendingFromOwner) ||
          Boolean(selected.ex.inquiryOnly)))
    );
  }, [selected]);

  const selectedOtherId = selected
    ? getOtherUserId(selected.ex, effectiveMyUserId ?? undefined).toLowerCase()
    : null;
  const isSelectedBlocked = Boolean(
    selectedOtherId && blockedUserIds.includes(selectedOtherId),
  );
  const isBlockedBySelected = Boolean(
    selectedOtherId && blockedByUserIds.includes(selectedOtherId),
  );

  const isNewThreadBlockedByOther = Boolean(
    newThreadDraft?.otherUserId &&
      blockedByUserIds.includes(newThreadDraft.otherUserId.trim().toLowerCase()),
  );

  const effectiveBookingUserId = user?.id ?? bookingModalUserId ?? undefined;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const fn = () => setIsSmViewport(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    if (!splitPaneDragging) return;
    const rowEl = splitLayoutRef.current;
    const onMove = (e: PointerEvent) => {
      if (!rowEl) return;
      const rect = rowEl.getBoundingClientRect();
      const maxInbox = Math.min(
        MAX_INBOX_WIDTH_PX,
        Math.max(MIN_INBOX_WIDTH_PX, rect.width - MIN_CHAT_PANE_WIDTH_PX),
      );
      const w = Math.min(
        maxInbox,
        Math.max(MIN_INBOX_WIDTH_PX, e.clientX - rect.left),
      );
      splitDragWidthRef.current = w;
      setInboxWidthPx(w);
    };
    const end = () => {
      setSplitPaneDragging(false);
      try {
        localStorage.setItem(
          INBOX_WIDTH_STORAGE_KEY,
          String(splitDragWidthRef.current),
        );
      } catch {
        /* ignore */
      }
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [splitPaneDragging]);

  /** Tam sayfa kaymasını engelle; yalnızca sohbet listesi / thread kendi içinde scroll olur. */
  useEffect(() => {
    const htmlPrev = document.documentElement.style.overflow;
    const bodyPrev = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = htmlPrev;
      document.body.style.overflow = bodyPrev;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setResolvedMyUserId(null);
      return;
    }
    if (user?.id) {
      setResolvedMyUserId(user.id);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const me = await fetchMyProfile(token);
        const id = me?.id?.trim();
        if (!cancelled && id) {
          setResolvedMyUserId(id);
          patchUser({ id });
        }
      } catch {
        if (!cancelled) setResolvedMyUserId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, user?.id, patchUser]);

  const studentUsesSkillAvailability = useMemo(() => {
    if (!selected || !effectiveBookingUserId) return false;
    return isRequesterSkillBookingSide(selected.ex, effectiveBookingUserId);
  }, [selected, effectiveBookingUserId]);

  const availabilityHookEnabled = Boolean(
    token && bookOpen && studentUsesSkillAvailability,
  );

  const {
    skill: bookingSkill,
    ready: bookingSkillReady,
    hasConstraints: bookingSkillHasConstraints,
    bookingDateOptions,
    bookingTimeOptions,
    bookableYmdSet,
    calendarMonthBounds,
  } = useBookingAvailabilityFromSkill({
    skillId: selected?.ex.skillId ?? null,
    enabled: availabilityHookEnabled,
    locale,
    selectedDateYmd: bookDate,
  });

  const hasBookingAvailabilityConstraints =
    studentUsesSkillAvailability && bookingSkillHasConstraints;

  const bookDateDisplayLabel = useMemo(() => {
    if (hasBookingAvailabilityConstraints && bookingDateOptions.length > 0) {
      const opt = bookingDateOptions.find((o) => o.value === bookDate);
      if (opt) return opt.label;
    }
    return ymdToLocalDate(bookDate).toLocaleDateString(
      locale === "tr" ? "tr-TR" : "en-US",
      {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      },
    );
  }, [
    hasBookingAvailabilityConstraints,
    bookingDateOptions,
    bookDate,
    locale,
  ]);

  const bookingMetaSummary = useMemo(() => {
    if (!bookingSkill || !hasSkillAvailabilityConstraints(bookingSkill)) {
      return null;
    }
    const dayLabels = t.addSkill.days;
    const dayIndex: Record<string, number> = {
      MONDAY: 0,
      TUESDAY: 1,
      WEDNESDAY: 2,
      THURSDAY: 3,
      FRIDAY: 4,
      SATURDAY: 5,
      SUNDAY: 6,
    };
    const metaDays = bookingSkill.availableDays?.length
      ? bookingSkill.availableDays
          .map((d) => dayLabels[dayIndex[d] ?? 0] ?? d)
          .join(", ")
      : null;
    const metaTime =
      bookingSkill.availableFrom && bookingSkill.availableUntil
        ? `${bookingSkill.availableFrom} – ${bookingSkill.availableUntil}`
        : null;
    const metaSessionType = bookingSkill.sessionTypes?.length
      ? bookingSkill.sessionTypes
          .map((v) =>
            v === "in-person" ? t.addSkill.inPerson : t.addSkill.online,
          )
          .join(", ")
      : null;
    const metaLocation = bookingSkill.inPersonLocation?.trim() || null;
    return { metaDays, metaTime, metaSessionType, metaLocation };
  }, [bookingSkill, t.addSkill]);

  const studentDateTimeLoading =
    studentUsesSkillAvailability && !bookingSkillReady;
  const studentFallbackDateTimeInputs = Boolean(
    studentUsesSkillAvailability &&
      bookingSkillReady &&
      bookingSkill &&
      !hasSkillAvailabilityConstraints(bookingSkill),
  );

  useEffect(() => {
    if (!hasBookingAvailabilityConstraints) return;
    if (bookingDateOptions.length === 0) return;
    if (!bookingDateOptions.some((d) => d.value === bookDate)) {
      setBookDate(bookingDateOptions[0].value);
    }
  }, [hasBookingAvailabilityConstraints, bookingDateOptions, bookDate]);

  useEffect(() => {
    if (!hasBookingAvailabilityConstraints) return;
    if (bookingTimeOptions.length === 0) return;
    if (!bookingTimeOptions.includes(bookTime)) {
      setBookTime(bookingTimeOptions[0]);
    }
  }, [hasBookingAvailabilityConstraints, bookingTimeOptions, bookTime]);

  useEffect(() => {
    if (!token) {
      void loadList();
      return;
    }
    if (!effectiveMyUserId) return;
    void loadList();
  }, [loadList, token, effectiveMyUserId]);

  /** Bekleyen giden talep: karşı taraf reddettiğinde liste eski kalmasın (çekme hatası / gecikmeli güncelleme). */
  useEffect(() => {
    if (!token || selected?.uiStatus !== "pending-outgoing") return;
    const refresh = () => {
      void loadList();
    };
    const tick = window.setInterval(refresh, 25000);
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(tick);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [token, selected?.uiStatus, loadList]);

  /** Rezervasyon modalı açıkken sohbet şeridinde eski/başka hata kalmasın (API metni karışmasın). */
  useEffect(() => {
    if (bookOpen) {
      setChatActionError(null);
    }
  }, [bookOpen]);

  /**
   * Intent: önce session + window.location (RR7'de setSearchParams ile temizlik state kaybına yol açabiliyor),
   * sonra navigate(..., { state }) ile gelen tiemposOpenChat.
   */
  useLayoutEffect(() => {
    const b = readMessagesRouteBootstrap();
    let userId = b.userId;
    let skillId = b.skillId;
    const exchangeId = b.exchangeId;
    try {
      const st = location.state as MessagesLocationState | null;
      const tc = st?.tiemposOpenChat;
      if (tc?.userId?.trim()) userId = tc.userId.trim();
      if (tc?.skillId?.trim()) skillId = tc.skillId.trim();
    } catch {
      /* ignore */
    }
    setRouteOpenIntent({ userId, skillId, exchangeId });
  }, [location.key]);

  const hydrateBlockState = useCallback(
    async (authToken: string) => {
      const state = await fetchMyBlockState(authToken);
      const mine = Array.from(
        new Set(
          (state.blockedUserIds ?? [])
            .map((v) => String(v).trim().toLowerCase())
            .filter(Boolean),
        ),
      );
      const blockedMe = Array.from(
        new Set(
          (state.blockedByUserIds ?? [])
            .map((v) => String(v).trim().toLowerCase())
            .filter(Boolean),
        ),
      );
      setBlockedUserIds(mine);
      setBlockedByUserIds(blockedMe);
    },
    [],
  );

  useEffect(() => {
    if (!token) {
      setBlockedUserIds([]);
      setBlockedByUserIds([]);
      return;
    }
    void hydrateBlockState(token).catch(() => {
      setBlockedUserIds([]);
      setBlockedByUserIds([]);
    });
  }, [token, hydrateBlockState]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchNotifications(token);
        if (cancelled) return;
        const unreadMessageNotificationIds = list
          .filter((n) => isNotificationUnread(n) && Boolean(n.exchangeRequestId))
          .map((n) => n.id);
        if (unreadMessageNotificationIds.length === 0) return;
        await Promise.all(
          unreadMessageNotificationIds.map((id) =>
            markNotificationRead(token, id).catch(() => undefined),
          ),
        );
        window.dispatchEvent(new Event("tiempos:notifications-changed"));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token || rows.length === 0) return;
    const missingIds = Array.from(
      new Set(
        rows
          .map((r) => r.otherUserId.trim().toLowerCase())
          .filter((id) => id && !userAvatarById[id]),
      ),
    );
    if (missingIds.length === 0) return;
    let cancelled = false;
    void (async () => {
      const resolved: Record<string, string> = {};
      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const p: PublicUserProfileDto = await fetchPublicUserProfile(id, token);
            const src = p.avatarUrl?.trim();
            if (src) resolved[id] = src;
          } catch {
            /* ignore individual failures */
          }
        }),
      );
      if (cancelled || Object.keys(resolved).length === 0) return;
      setUserAvatarById((prev) => ({ ...prev, ...resolved }));
    })();
    return () => {
      cancelled = true;
    };
  }, [rows, token, userAvatarById]);

  useEffect(() => {
    const exId = routeOpenIntent.exchangeId;
    if (!exId || rows.length === 0) return;
    for (const r of rows) {
      if (
        r.exchanges.some(
          (e) =>
            e.id.toLowerCase() === exId.toLowerCase(),
        )
      ) {
        setSelectedOtherUserId(r.otherUserId);
        setActiveExchangeId(exId);
        setRouteOpenIntent((p) => ({ ...p, exchangeId: null }));
        return;
      }
    }
    setRouteOpenIntent((p) => ({ ...p, exchangeId: null }));
  }, [rows, routeOpenIntent.exchangeId]);

  useEffect(() => {
    if (!token || loadingListRef.current) return;
    const uid = routeOpenIntent.userId?.trim();
    if (!uid) return;

    const row = rows.find(
      (r) => r.otherUserId.trim().toLowerCase() === uid.toLowerCase(),
    );
    if (row) {
      pendingOpenNewChatUserLowerRef.current = null;
      openInstructorIntentFlightRef.current = null;
      setNewThreadDraft(null);
      setDraftFirstMessage("");
      setSelectedOtherUserId(row.otherUserId);
      setActiveExchangeId(row.exchanges[0]?.id ?? null);
      setRouteOpenIntent((p) => ({ ...p, userId: null, skillId: null }));
      clearStoredOpenNavIntent();
      return;
    }

    const sid = routeOpenIntent.skillId?.trim();
    if (!sid) {
      pendingOpenNewChatUserLowerRef.current = null;
      openInstructorIntentFlightRef.current = null;
      setRouteOpenIntent((p) => ({ ...p, userId: null, skillId: null }));
      clearStoredOpenNavIntent();
      return;
    }

    const flightKey = `${uid.toLowerCase()}\n${sid.toLowerCase()}`;
    if (openInstructorIntentFlightRef.current === flightKey) {
      return;
    }
    openInstructorIntentFlightRef.current = flightKey;

    let cancelled = false;
    pendingOpenNewChatUserLowerRef.current = uid.toLowerCase();
    void (async () => {
      try {
        const sk = await fetchSkillById(sid);
        if (cancelled) return;
        if (sk.ownerId.trim().toLowerCase() !== uid.toLowerCase()) {
          pendingOpenNewChatUserLowerRef.current = null;
          if (openInstructorIntentFlightRef.current === flightKey) {
            openInstructorIntentFlightRef.current = null;
          }
          setChatActionError(m.newThreadOwnerMismatch);
          setRouteOpenIntent((p) => ({ ...p, userId: null, skillId: null }));
          clearStoredOpenNavIntent();
          return;
        }
        let profile: PublicUserProfileDto | null = null;
        try {
          profile = await fetchPublicUserProfile(uid, token);
        } catch {
          /* avatar/isim için tercih; beceri kartında ownerName yeterli */
        }
        if (cancelled) return;
        const name =
          profile?.fullName?.trim() ||
          sk.ownerName?.trim() ||
          m.newThreadUnknownName;
        const av = profile?.avatarUrl?.trim();
        if (av) {
          setUserAvatarById((prev) => ({
            ...prev,
            [uid.toLowerCase()]: av,
          }));
        }
        setNewThreadDraft({
          otherUserId: sk.ownerId,
          otherName: name,
          skill: sk,
        });
        setSelectedOtherUserId(sk.ownerId);
        setDraftFirstMessage("");
        userClosedConversationPaneRef.current = false;
      } catch (e) {
        if (!cancelled) {
          setChatActionError(apiErrorDisplayMessage(e, m.actionError));
          clearStoredOpenNavIntent();
        }
      } finally {
        pendingOpenNewChatUserLowerRef.current = null;
        if (openInstructorIntentFlightRef.current === flightKey) {
          openInstructorIntentFlightRef.current = null;
        }
        if (!cancelled) {
          setRouteOpenIntent((p) => ({ ...p, userId: null, skillId: null }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, rows, routeOpenIntent.userId, routeOpenIntent.skillId, m]);

  /** İlk yüklemede (veya sayfa yeniden açıldığında) en güncel konuşmayı sağ panelde aç; bildirim/?open= yönlendirmesi varken bekleme */
  useEffect(() => {
    if (!token || loadingListRef.current || rows.length === 0) return;
    if (
      routeOpenIntent.exchangeId ||
      routeOpenIntent.userId ||
      newThreadDraft
    )
      return;
    if (selectedOtherUserId) return;
    if (userClosedConversationPaneRef.current) return;
    const first = rows[0];
    if (!first?.exchanges[0]) return;
    setSelectedOtherUserId(first.otherUserId);
    setActiveExchangeId(first.exchanges[0].id);
  }, [
    token,
    rows,
    selectedOtherUserId,
    routeOpenIntent.exchangeId,
    routeOpenIntent.userId,
    newThreadDraft,
  ]);

  useEffect(() => {
    if (!selectedOtherUserId) return;
    if (
      newThreadDraft &&
      newThreadDraft.otherUserId.trim().toLowerCase() ===
        selectedOtherUserId.trim().toLowerCase()
    ) {
      return;
    }
    const row = rows.find(
      (r) => r.otherUserId.trim().toLowerCase() === selectedOtherUserId.trim().toLowerCase(),
    );
    if (!row) {
      const sel = selectedOtherUserId.trim().toLowerCase();
      if (
        pendingOpenNewChatUserLowerRef.current &&
        pendingOpenNewChatUserLowerRef.current === sel
      ) {
        return;
      }
      setSelectedOtherUserId(null);
      setActiveExchangeId(null);
      return;
    }
    if (
      !activeExchangeId ||
      !row.exchanges.some(
        (e) => e.id.toLowerCase() === activeExchangeId.toLowerCase(),
      )
    ) {
      setActiveExchangeId(row.exchanges[0].id);
    }
  }, [rows, selectedOtherUserId, activeExchangeId, newThreadDraft]);
  const canCancelSelected = Boolean(
    selected && canCancelExchange(selected.ex, user?.id),
  );
  const isSelectedOwnerSide = Boolean(
    selected && sameUserId(selected.ex.ownerId, user?.id),
  );
  const isSelectedRequesterSide = Boolean(
    selected && sameUserId(selected.ex.requesterId, user?.id),
  );
  // Seans zamanına bağlı arayüz (onay butonu, sonraki adım) için dakikalık saat.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const selectedStartMs = selected?.ex.scheduledStartAt
    ? new Date(selected.ex.scheduledStartAt).getTime()
    : null;
  const selectedEndMs =
    selectedStartMs != null && selected
      ? selectedStartMs + selected.ex.bookedMinutes * 60_000
      : null;
  /** Katılım onayı yalnızca başlangıçtan sonra (sunucu da erken onayı reddeder). */
  const sessionStarted = selectedStartMs == null || nowMs >= selectedStartMs;
  const myAckDone = Boolean(
    selected &&
      ((isSelectedRequesterSide && selected.ex.requesterAttendanceAckAt) ||
        (isSelectedOwnerSide && selected.ex.ownerAttendanceAckAt)),
  );
  const acceptedNextStep = !selected
    ? ""
    : !sessionStarted
      ? formatTemplate(
          isSelectedOwnerSide ? m.nextStepOwnerBefore : m.nextStepLearnerBefore,
          { minutes: selected.ex.bookedMinutes },
        )
      : myAckDone
        ? m.nextStepWaitingPeer
        : selectedEndMs != null && nowMs > selectedEndMs
          ? m.nextStepEnded
          : m.nextStepLive;
  const openOtherProfile = useCallback(() => {
    if (!selected) return;
    const oid = getOtherUserId(selected.ex, user?.id);
    if (user?.id && oid.toLowerCase() === user.id.toLowerCase()) {
      onNavigate?.("profile");
      return;
    }
    onViewUserProfile?.(oid);
  }, [onNavigate, onViewUserProfile, selected, user?.id]);

  const toggleBlockSelectedUser = useCallback(async () => {
    if (!selected || !token) return;
    const oid = getOtherUserId(selected.ex, user?.id).toLowerCase();
    if (!oid) return;
    setChatActionError(null);
    try {
      if (blockedUserIds.includes(oid)) {
        const state = await unblockUser(token, oid);
        setBlockedUserIds(
          Array.from(
            new Set(
              (state.blockedUserIds ?? [])
                .map((id) => String(id).trim().toLowerCase())
                .filter(Boolean),
            ),
          ),
        );
      } else {
        const state = await blockUser(token, oid);
        setBlockedUserIds(
          Array.from(
            new Set(
              (state.blockedUserIds ?? [])
                .map((id) => String(id).trim().toLowerCase())
                .filter(Boolean),
            ),
          ),
        );
      }
      await hydrateBlockState(token);
    } catch (e) {
      setChatActionError(apiErrorDisplayMessage(e, m.actionError));
    }
  }, [blockedUserIds, hydrateBlockState, m.actionError, selected, token, user?.id]);

  const handleBlockButtonClick = useCallback(() => {
    if (isSelectedBlocked) {
      void toggleBlockSelectedUser();
      return;
    }
    setBlockConfirmOpen(true);
  }, [isSelectedBlocked, toggleBlockSelectedUser]);

  const confirmBlockSelectedUser = useCallback(async () => {
    setBlockConfirmPending(true);
    try {
      await toggleBlockSelectedUser();
      setBlockConfirmOpen(false);
    } finally {
      setBlockConfirmPending(false);
    }
  }, [toggleBlockSelectedUser]);

  const loadThread = useCallback(
    async (row: ConversationRow | null) => {
      if (!token || !row) {
        setThreadLines([]);
        return;
      }
      setLoadingThread(true);
      setChatActionError(null);
      try {
        const allLines: ThreadLine[] = [];
        const exchangesChrono = [...row.exchanges].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

        for (const ex of exchangesChrono) {
          const createdMs = new Date(ex.createdAt).getTime();
          allLines.push({
            id: `initial-${ex.id}`,
            kind: "message",
            sender: isInitialMessageFromMe(ex, effectiveMyUserId ?? undefined)
              ? "me"
              : "other",
            text: ex.message,
            timeLabel: new Date(ex.createdAt).toLocaleString(
              locale === "tr" ? "tr-TR" : "en-US",
              { dateStyle: "short", timeStyle: "short" },
            ),
            sortMs: createdMs,
          });

          const status = toUiStatus(ex, effectiveMyUserId ?? undefined);
          if (status === "rejected" || status === "pending-incoming" || status === "pending-outgoing") {
            allLines.push({
              id: `offer-${ex.id}`,
              kind: "offer-card",
              sender: "other",
              offerStatus: status,
              offerSkillTitle: ex.skillTitle,
              offerScheduledAt: ex.scheduledStartAt,
              offerMinutes: ex.bookedMinutes,
              timeLabel: new Date(ex.createdAt).toLocaleString(
                locale === "tr" ? "tr-TR" : "en-US",
                { dateStyle: "short", timeStyle: "short" },
              ),
              sortMs: createdMs + 1,
            });
          }

          if (!isMessageEnabledStatus(ex.status)) {
            continue;
          }
          try {
            const apiMsgs = await fetchExchangeMessages(token, ex.id);
            const apiLines: ThreadLine[] = apiMsgs.map((msg: ExchangeMessageDto) => {
              const ms = new Date(msg.createdAt).getTime();
              return {
                id: msg.id,
                kind: "message",
                sender: sameUserId(msg.senderId, effectiveMyUserId ?? undefined)
                  ? "me"
                  : "other",
                text: msg.body,
                timeLabel: new Date(msg.createdAt).toLocaleString(
                  locale === "tr" ? "tr-TR" : "en-US",
                  { dateStyle: "short", timeStyle: "short" },
                ),
                sortMs: ms,
              };
            });
            allLines.push(...apiLines);
          } catch {
            // Keep timeline visible even if one exchange's messages cannot be fetched.
          }
        }

        allLines.sort((a, b) => a.sortMs - b.sortMs);
        setThreadLines(allLines);
      } catch {
        setThreadLines([]);
      } finally {
        setLoadingThread(false);
      }
    },
    [token, effectiveMyUserId, locale],
  );

  useEffect(() => {
    if (selected) void loadThread(selected.row);
  }, [selected, loadThread]);

  useEffect(() => {
    if (!selected) return;
    const node = threadScrollRef.current;
    if (!node) return;
    const raf = window.requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
    return () => window.cancelAnimationFrame(raf);
  }, [selected?.ex.id, threadLines.length, loadingThread]);

  const filteredRows = rows.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    if (r.otherName.toLowerCase().includes(q)) return true;
    if (r.lastPreview.toLowerCase().includes(q)) return true;
    return r.exchanges.some(
      (e) =>
        e.skillTitle.toLowerCase().includes(q) ||
        e.message.toLowerCase().includes(q),
    );
  });

  const focusExchangeAfterList = useCallback(
    (next: ConversationRow[], exchangeId: string) => {
      const r = next.find((row) =>
        row.exchanges.some((e) => e.id === exchangeId),
      );
      if (r) {
        setSelectedOtherUserId(r.otherUserId);
        setActiveExchangeId(exchangeId);
      }
    },
    [],
  );

  const handleAccept = async (id: string) => {
    if (!token) return;
    try {
      await acceptExchangeRequest(token, id);
      const next = await loadList();
      focusExchangeAfterList(next, id);
    } catch (e) {
      setChatActionError(apiErrorDisplayMessage(e, m.actionError));
    }
  };

  const handleReject = async (id: string) => {
    if (!token) return;
    try {
      await rejectExchangeRequest(token, id);
      const next = await loadList();
      focusExchangeAfterList(next, id);
    } catch (e) {
      setChatActionError(apiErrorDisplayMessage(e, m.actionError));
    }
  };

  const handleCancelExchange = async () => {
    if (!token || !selected) return;
    setChatActionError(null);
    setCancelError(null);
    const exId = selected.ex.id;
    try {
      await cancelExchangeRequest(token, exId);
      setCancelOpen(false);
      const next = await loadList();
      focusExchangeAfterList(next, exId);
    } catch (e) {
      const msg = apiErrorDisplayMessage(e, m.actionError);
      const next = await loadList();
      focusExchangeAfterList(next, exId);
      const exAfter = findExchangeInRows(next, exId);
      const st = normalizeExchangeStatus(exAfter?.status);
      if (st === "REJECTED") {
        setCancelOpen(false);
        setCancelError(null);
        setChatActionError(null);
      } else {
        setCancelError(msg);
      }
    }
  };

  const handleRequesterStarted = async () => {
    if (!token || !selected) return;
    setChatActionError(null);
    const exId = selected.ex.id;
    try {
      await acknowledgeRequesterAttendance(token, exId);
      const next = await loadList();
      focusExchangeAfterList(next, exId);
    } catch (e) {
      setChatActionError(apiErrorDisplayMessage(e, m.actionError));
    }
  };

  const handleOwnerStarted = async () => {
    if (!token || !selected) return;
    setChatActionError(null);
    const exId = selected.ex.id;
    try {
      await acknowledgeOwnerAttendance(token, exId);
      const next = await loadList();
      focusExchangeAfterList(next, exId);
    } catch (e) {
      setChatActionError(apiErrorDisplayMessage(e, m.actionError));
    }
  };

  const handleRejectAndOfferOtherTime = async (id: string) => {
    if (!token || !selected) return;
    let resolvedUserId = user?.id ?? null;
    if (!resolvedUserId) {
      try {
        const p = await fetchMyProfile(token);
        if (p?.id) {
          resolvedUserId = p.id;
          patchUser({ id: p.id });
        }
      } catch {
        /* aşağıda hata */
      }
    }
    if (!resolvedUserId) {
      setChatActionError(m.bookingNeedUserId);
      return;
    }
    setBookingModalUserId(resolvedUserId);
    try {
      await rejectExchangeRequest(token, id);
      const next = await loadList();
      focusExchangeAfterList(next, id);
      setBookDate(tomorrowDateStr());
      setBookTime("10:00");
      setBookCalendarMonth(ymdToLocalDate(tomorrowDateStr()));
      setBookMessage(
        formatTemplate(m.offerOtherTimeDraft, {
          skill: selected.ex.skillTitle,
        }),
      );
      setBookOpen(true);
      setChatActionError(null);
      bookErrorRef.current = null;
      setBookError(null);
    } catch (e) {
      setChatActionError(apiErrorDisplayMessage(e, m.actionError));
    }
  };

  const handleSubmitNewThreadDraft = async () => {
    if (!token || !newThreadDraft || draftSubmitting) return;
    if (isNewThreadBlockedByOther) return;
    const body = draftFirstMessage.trim();
    if (!body) {
      setChatActionError(m.newThreadEmptyMessage);
      return;
    }
    const sk = newThreadDraft.skill;
    const booked = sk.durationMinutes >= 30 ? sk.durationMinutes : 60;
    setDraftSubmitting(true);
    setChatActionError(null);
    try {
      const scheduledStartAt = firstBookableDefaultStartIso();
      const created = await createExchangeRequest(token, sk.id, {
        message: body,
        bookedMinutes: booked,
        scheduledStartAt,
        inquiryOnly: true,
      });
      const myId = user?.id ?? effectiveMyUserId ?? undefined;
      setNewThreadDraft(null);
      setDraftFirstMessage("");
      clearStoredOpenNavIntent();
      await loadList();
      setSelectedOtherUserId(getOtherUserId(created, myId));
      setActiveExchangeId(created.id);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setChatActionError(m.authSessionInvalid);
      } else if (e instanceof ApiError && e.status === 403) {
        const raw = e.message.trim();
        const generic =
          !raw || raw === "Forbidden" || raw === "Access Denied";
        setChatActionError(
          generic ? m.authSessionInvalid : apiErrorDisplayMessage(e, m.actionError),
        );
      } else {
        setChatActionError(apiErrorDisplayMessage(e, m.actionError));
      }
    } finally {
      setDraftSubmitting(false);
    }
  };

  const handleSend = async () => {
    if (!token || !selected || !messageText.trim()) return;
    if (isBlockedBySelected) return;
    if (!composerAllowsSend) return;
    setChatActionError(null);
    try {
      await postExchangeMessage(token, selected.ex.id, messageText.trim());
      setMessageText("");
      await loadThread(selected.row);
    } catch (e) {
      setChatActionError(apiErrorDisplayMessage(e, m.actionError));
      return;
    }
    try {
      await loadList();
    } catch {
      /* Konuşma listesi yenilenemese bile mesaj gönderildi; sessizce geç */
    }
  };

  /** Rezervasyon modalını kapatır (İptal / başarı); hata varken backdrop bunu kullanmaz. */
  const closeBookModal = useCallback(() => {
    bookErrorRef.current = null;
    setBookError(null);
    setChatActionError(null);
    setBookDatePopoverOpen(false);
    setBookingModalUserId(null);
    setBookOpen(false);
  }, []);

  const handleBookModalOpenChange = useCallback((open: boolean) => {
    if (!open && bookSubmittingRef.current) return;
    // API / doğrulama hatası varken overlay tıklaması modalı kapatmasın; uyarı kaybolmasın.
    if (!open && bookErrorRef.current) return;
    setBookOpen(open);
    if (!open) {
      bookErrorRef.current = null;
      setBookError(null);
      setBookDatePopoverOpen(false);
      setChatActionError(null);
      setBookingModalUserId(null);
    }
  }, []);

  const handleCreateBooking = async () => {
    if (!token || !selected) return;
    setBookDatePopoverOpen(false);
    setChatActionError(null);
    bookSubmittingRef.current = true;
    setBookSubmitting(true);
    bookErrorRef.current = null;
    setBookError(null);
    try {
      let scheduledStartAt = localDateTimeToUtcIso(bookDate, bookTime);
      const minMs = Date.now() + 60 * 60 * 1000;
      if (
        studentUsesSkillAvailability &&
        bookingSkill &&
        hasSkillAvailabilityConstraints(bookingSkill)
      ) {
        if (bookingDateOptions.length === 0) {
          const err = sd.bookNoSlots;
          bookErrorRef.current = err;
          flushSync(() => {
            setBookError(err);
            setBookOpen(true);
            setBookDatePopoverOpen(true);
          });
          return;
        }
        let effectiveDate = bookDate;
        if (!bookingDateOptions.some((o) => o.value === effectiveDate)) {
          effectiveDate = bookingDateOptions[0].value;
        }
        const slotTimes = buildSkillTimeOptionsForDate(bookingSkill, effectiveDate);
        let effectiveTime = bookTime;
        if (slotTimes.length === 0) {
          const err = sd.bookNoSlots;
          bookErrorRef.current = err;
          flushSync(() => {
            setBookError(err);
            setBookOpen(true);
            setBookDatePopoverOpen(true);
          });
          return;
        }
        if (!slotTimes.includes(effectiveTime)) {
          effectiveTime = slotTimes[0];
        }
        if (
          !isWithinSkillAvailability(bookingSkill, effectiveDate, effectiveTime)
        ) {
          const err = sd.bookOutsideAvailability;
          bookErrorRef.current = err;
          flushSync(() => {
            setBookError(err);
            setBookOpen(true);
            setBookDatePopoverOpen(true);
          });
          return;
        }
        if (effectiveDate !== bookDate) setBookDate(effectiveDate);
        if (effectiveTime !== bookTime) setBookTime(effectiveTime);
        scheduledStartAt = localDateTimeToUtcIso(effectiveDate, effectiveTime);
      }
      if (new Date(scheduledStartAt).getTime() < minMs) {
        const soon = m.bookTooSoon;
        bookErrorRef.current = soon;
        flushSync(() => {
          setBookError(soon);
          setBookOpen(true);
          setBookDatePopoverOpen(true);
        });
        return;
      }
      const payload = {
        message: bookMessage.trim() || selected.ex.message || m.bookFallbackMessage,
        bookedMinutes: selected.ex.bookedMinutes,
        scheduledStartAt,
      };
      const isRejected = selected.uiStatus === "rejected";
      const uidForCounter =
        user?.id ?? bookingModalUserId ?? undefined;
      const shouldRequesterCounterOffer =
        isRejected &&
        Boolean(selected.ex.pendingFromOwner) &&
        Boolean(uidForCounter) &&
        isRequesterSkillBookingSide(selected.ex, uidForCounter);
      /** Öğrenci eğitmen teklifini reddettikten sonra eğitmen yeniden teklif verir (pendingFromOwner true olsa da). */
      const shouldOwnerCounterOffer =
        isRejected && sameUserId(selected.ex.ownerId, user?.id);
      const created = shouldOwnerCounterOffer
        ? await createCounterOffer(token, selected.ex.id, payload)
        : shouldRequesterCounterOffer
          ? await createRequesterCounterOffer(token, selected.ex.id, payload)
          : await createExchangeRequest(token, selected.ex.skillId, payload);
      try {
        sessionStorage.setItem(OPEN_EXCHANGE_KEY, created.id);
      } catch {
        /* ignore */
      }
      closeBookModal();
      const next = await loadList();
      if (shouldOwnerCounterOffer || shouldRequesterCounterOffer) {
        focusExchangeAfterList(next, created.id);
      } else {
        setSelectedOtherUserId(getOtherUserId(created, user?.id));
        setActiveExchangeId(created.id);
      }
    } catch (e) {
      const msg = apiErrorDisplayMessage(e, m.actionError);
      bookErrorRef.current = msg;
      flushSync(() => {
        setBookError(msg);
        setBookOpen(true);
        setBookDatePopoverOpen(true);
      });
    } finally {
      bookSubmittingRef.current = false;
      setBookSubmitting(false);
    }
  };

  const showMessageComposer = composerAllowsSend;

  const showConversationPane = useMemo(
    () =>
      Boolean(
        selectedOtherUserId ||
          newThreadDraft ||
          (Boolean(routeOpenIntent.userId?.trim()) &&
            Boolean(routeOpenIntent.skillId?.trim())),
      ),
    [
      selectedOtherUserId,
      newThreadDraft,
      routeOpenIntent.userId,
      routeOpenIntent.skillId,
    ],
  );

  const showOpeningNavHint = useMemo(
    () =>
      Boolean(
        routeOpenIntent.userId?.trim() &&
          routeOpenIntent.skillId?.trim() &&
          !newThreadDraft &&
          !selected,
      ),
    [routeOpenIntent.userId, routeOpenIntent.skillId, newThreadDraft, selected],
  );

  const onInboxSplitPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSmViewport) return;
    e.preventDefault();
    splitDragWidthRef.current = inboxWidthPx;
    e.currentTarget.setPointerCapture(e.pointerId);
    setSplitPaneDragging(true);
  };

  return (
    <PageLayout hideFooter onNavigate={onNavigate}>
      <div className="messages-page box-border w-full px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
        <div className="messages-page__inner mx-auto w-full max-w-7xl">
          <div
            ref={splitLayoutRef}
            className="flex min-h-0 w-full flex-1 flex-row overflow-hidden rounded-2xl"
          >
          <Card className="messages-card flex min-h-0 flex-1 flex-row gap-0 overflow-hidden rounded-2xl border-0 shadow-lg">
            <div
              className={cn(
                "inbox-pane border-r border-border sm:flex-[0_0_auto] sm:shrink-0",
                selectedOtherUserId || newThreadDraft || showOpeningNavHint
                  ? "hidden w-full min-w-0 sm:flex"
                  : "flex w-full min-w-0",
              )}
              style={
                isSmViewport
                  ? {
                      width: inboxWidthPx,
                      minWidth: MIN_INBOX_WIDTH_PX,
                      maxWidth: MAX_INBOX_WIDTH_PX,
                    }
                  : undefined
              }
            >
              <div className="chat-header border-b border-border p-4">
                <h2 className="mb-4 text-xl text-foreground">{m.title}</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={m.searchPlaceholder}
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="messages-container overscroll-contain">
                {loadingList || listAwaitingMyId ? (
                  <p className="p-6 text-sm text-muted-foreground">
                    {t.common.loading}
                  </p>
                ) : filteredRows.length === 0 ? (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                    <MessageCircle className="h-10 w-10 opacity-40" />
                    <p className="text-sm">{m.emptyList}</p>
                  </div>
                ) : (
                  filteredRows.map((conv) => {
                    const latest = conv.exchanges[0];
                    const isBlocked = blockedUserIds.includes(
                      conv.otherUserId.toLowerCase(),
                    );
                    const convAvatar =
                      userAvatarById[conv.otherUserId.trim().toLowerCase()];
                    return (
                    <button
                      key={conv.otherUserId}
                      type="button"
                      onClick={() => {
                        setSelectedOtherUserId(conv.otherUserId);
                        setActiveExchangeId(latest.id);
                      }}
                      className={`w-full border-b border-border p-4 text-left transition-colors hover:bg-accent/50 ${
                        selectedOtherUserId === conv.otherUserId
                          ? "bg-primary/10"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {convAvatar ? (
                          <img
                            src={convAvatar}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
                            aria-hidden
                          >
                            {initialsFromFullName(conv.otherName)}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <h3 className="truncate text-sm text-foreground">
                              {conv.otherName}
                            </h3>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {new Date(latest.createdAt).toLocaleDateString(
                                locale === "tr" ? "tr-TR" : "en-US",
                              )}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {latest.skillTitle} · {latest.bookedMinutes} min
                            {conv.exchanges.length > 1
                              ? ` · +${conv.exchanges.length - 1}`
                              : ""}
                          </p>
                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {conv.lastPreview}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {conv.listUiStatus === "pending-incoming" && (
                              <Badge variant="secondary">{m.pendingRequest}</Badge>
                            )}
                            {conv.listUiStatus === "pending-outgoing" && (
                              <Badge variant="outline">{m.waitingApproval}</Badge>
                            )}
                            {conv.listUiStatus === "rejected" && (
                              <Badge variant="destructive">{m.rejectedBadge}</Badge>
                            )}
                            {conv.listUiStatus === "accepted" && (
                              <Badge className="bg-emerald-600/90 text-white">
                                {m.acceptedBadge}
                              </Badge>
                            )}
                            {conv.listUiStatus === "cancelled" && (
                              <Badge variant="secondary">{m.cancelledBadge}</Badge>
                            )}
                            {conv.listUiStatus === "completed" && (
                              <Badge>{m.completedBadge}</Badge>
                            )}
                            {isBlocked && (
                              <Badge variant="outline">{m.blockedBadge}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                  })
                )}
              </div>
            </div>

            <div
              role="separator"
              aria-orientation="vertical"
              aria-label={m.resizeSplitAria}
              className="hidden w-0 shrink-0 cursor-col-resize touch-none sm:relative sm:z-[1] sm:flex sm:w-2 sm:max-w-[0.5rem] sm:shrink-0 sm:items-stretch sm:justify-center sm:border-x sm:border-border/60 sm:bg-muted/30 sm:hover:bg-muted/60"
              onPointerDown={onInboxSplitPointerDown}
            >
              <span
                className="pointer-events-none mx-auto my-2 h-[calc(100%-1rem)] w-px shrink-0 bg-border"
                aria-hidden
              />
            </div>

            <div
              className={cn(
                "chat-pane",
                showConversationPane ? "flex" : "hidden sm:flex",
              )}
            >
              {showOpeningNavHint ? (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                  <MessageCircle className="h-12 w-12 animate-pulse text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">{t.common.loading}</p>
                </div>
              ) : selected ? (
                <>
                  <div className="chat-header border-b border-border bg-card">
                  <div className="flex shrink-0 items-center justify-between border-b border-border p-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <button
                        type="button"
                        className="mr-1 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent sm:hidden"
                        onClick={() => {
                          userClosedConversationPaneRef.current = true;
                          setSelectedOtherUserId(null);
                          setActiveExchangeId(null);
                        }}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={openOtherProfile}
                        className="flex min-w-0 max-w-full items-center gap-3 rounded-lg p-0 text-left transition hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        title={m.viewMemberProfileTitle}
                      >
                        {selectedOtherId && userAvatarById[selectedOtherId] ? (
                          <img
                            src={userAvatarById[selectedOtherId]}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
                            aria-hidden
                          >
                            {initialsFromFullName(selected.otherName)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="truncate text-foreground">
                            {selected.otherName}
                          </h3>
                          <p className="truncate text-xs text-muted-foreground">
                            {selected.ex.skillTitle}
                          </p>
                        </div>
                      </button>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={isSelectedBlocked ? "outline" : "destructive"}
                      className="ml-3 shrink-0"
                      onClick={handleBlockButtonClick}
                    >
                      {isSelectedBlocked ? m.unblockUser : m.blockUser}
                    </Button>
                  </div>

                  {selected.uiStatus === "pending-incoming" && (
                    <div className="shrink-0 border-b border-border bg-muted p-4">
                      <p className="mb-3 text-sm font-medium text-slate-800 dark:text-sky-100">
                        {formatTemplate(
                          selected.ex.pendingFromOwner
                            ? m.ownerProposedNewSlot
                            : m.wantsConnect,
                          {
                            name: selected.otherName,
                          },
                        )}
                      </p>
                      <div className="mb-3 rounded-xl border border-sky-200/80 bg-white/70 p-3 text-sm text-slate-700 shadow-sm dark:border-sky-800/60 dark:bg-slate-900/70 dark:text-slate-100">
                        <p>
                          {m.requestSkill}: {selected.ex.skillTitle}
                        </p>
                        <p>
                          {m.requestDateTime}:{" "}
                          {formatScheduledAt(selected.ex.scheduledStartAt, locale)}
                        </p>
                        <p>
                          {m.requestMessage}: {selected.ex.message}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-blue-500 to-blue-700 text-white"
                          onClick={() => void handleAccept(selected.ex.id)}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          {m.accept}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-300 bg-white/90 text-slate-700 hover:bg-slate-100 dark:!border-slate-500 dark:!bg-slate-800 dark:!text-slate-100 dark:hover:!bg-slate-700"
                          onClick={() => void handleReject(selected.ex.id)}
                        >
                          <X className="mr-1 h-4 w-4" />
                          {m.decline}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-300 bg-white/90 text-slate-700 hover:bg-slate-100 dark:!border-slate-500 dark:!bg-slate-800 dark:!text-slate-100 dark:hover:!bg-slate-700"
                          onClick={() =>
                            void handleRejectAndOfferOtherTime(selected.ex.id)
                          }
                        >
                          <CalendarPlus className="mr-1 h-4 w-4" />
                          {m.declineAndOfferOtherTime}
                        </Button>
                      </div>
                    </div>
                  )}

                  {selected.uiStatus === "pending-outgoing" && (
                    <div className="shrink-0 border-b border-amber-200 bg-amber-50/95 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-100">
                      <p className="text-sm">
                        {formatTemplate(m.waitingOutgoing, {
                          name: selected.otherName,
                        })}
                      </p>
                      {canCancelSelected &&
                      normalizeExchangeStatus(selected.ex.status) === "PENDING" ? (
                        <div className="mt-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-amber-700/40 text-amber-900 hover:bg-amber-100 dark:border-amber-300/40 dark:text-amber-100 dark:hover:bg-amber-900/40"
                            onClick={() => {
                              setCancelError(null);
                              setCancelOpen(true);
                            }}
                          >
                            <X className="mr-1 h-4 w-4" />
                            {m.cancelPending}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {selected.uiStatus === "rejected" && (
                    <div className="shrink-0 border-b border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                      <p>{m.rejectedHint}</p>
                    </div>
                  )}

                  {selected.uiStatus === "accepted" && (
                    <div className="shrink-0 border-b border-emerald-100 bg-emerald-50 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
                        <div className="min-w-0 flex-1 space-y-0.5 text-xs leading-tight text-foreground/90 sm:text-sm">
                          <p className="truncate font-medium">{selected.ex.skillTitle}</p>
                          <p className="truncate text-muted-foreground">
                            {formatScheduledAt(selected.ex.scheduledStartAt, locale)}
                          </p>
                          <p className="tp-next-step" role="status">
                            {acceptedNextStep}
                          </p>
                        </div>
                        <div className="flex max-w-full shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                          {canCancelSelected ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 shrink-0 border-destructive/50 px-2 text-xs text-destructive hover:bg-destructive/10 sm:px-3 sm:text-sm"
                              onClick={() => {
                                setCancelError(null);
                                setCancelOpen(true);
                              }}
                            >
                              <X className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              {m.cancelSession}
                            </Button>
                          ) : null}
                          {sessionStarted && isSelectedRequesterSide && !selected.ex.requesterAttendanceAckAt ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-8 shrink-0 px-2 text-xs sm:px-3 sm:text-sm"
                              onClick={() => void handleRequesterStarted()}
                            >
                              {m.requesterConfirmStarted}
                            </Button>
                          ) : null}
                          {sessionStarted && isSelectedOwnerSide && !selected.ex.ownerAttendanceAckAt ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-8 shrink-0 px-2 text-xs sm:px-3 sm:text-sm"
                              onClick={() => void handleOwnerStarted()}
                            >
                              {m.ownerConfirmStarted}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}

                  {selected.uiStatus === "cancelled" && (
                    <div className="shrink-0 border-b border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                      <p>{m.cancelledHint}</p>
                    </div>
                  )}

                  {selected.uiStatus === "completed" && (
                    <div className="shrink-0 border-b border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
                      {m.sessionCompletedHint}
                    </div>
                  )}
                  </div>

                  <div
                    ref={threadScrollRef}
                    className="messages-container bg-muted/20 dark:bg-background/80"
                  >
                    <div
                      className={cn(
                        "flex min-h-full flex-col gap-4 p-4",
                        loadingThread
                          ? "items-center justify-center"
                          : "justify-end",
                      )}
                    >
                    {loadingThread ? (
                      <p className="text-center text-sm text-muted-foreground">
                        {t.common.loading}
                      </p>
                    ) : (
                      threadLines.map((line) => (
                        <div
                          key={line.id}
                          className={`flex ${line.sender === "me" ? "justify-end" : "justify-start"}`}
                        >
                          {line.kind === "offer-card" ? (
                            <div className="max-w-xl rounded-xl border border-border bg-muted/40 p-3 text-sm">
                              <p className="font-medium text-foreground">
                                {line.offerStatus === "rejected"
                                  ? m.rejectedBadge
                                  : line.offerStatus === "pending-incoming"
                                    ? m.pendingRequest
                                    : m.waitingApproval}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                {m.requestSkill}: {line.offerSkillTitle}
                              </p>
                              <p className="text-muted-foreground">
                                {m.requestDateTime}:{" "}
                                {formatScheduledAt(line.offerScheduledAt, locale)}
                              </p>
                              <p className="text-muted-foreground">
                                {line.offerMinutes} min
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {line.timeLabel}
                              </p>
                            </div>
                          ) : (
                            <div
                              className={`max-w-md ${line.sender === "me" ? "order-2" : "order-1"}`}
                            >
                              <div
                                className={`rounded-2xl p-3 ${
                                  line.sender === "me"
                                    ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white"
                                    : "bg-muted text-foreground"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">
                                  {line.text}
                                </p>
                              </div>
                              <p className="mt-1 px-3 text-xs text-muted-foreground">
                                {line.timeLabel}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    </div>
                  </div>

                  {/* Alt: composer — messages-container dışında, chat-input */}
                  <div
                    className="chat-input border-t border-border bg-card pt-[12px] pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.35)]"
                  >
                      {chatActionError && !bookOpen ? (
                        <div
                          role="alert"
                          className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
                        >
                          {chatActionError}
                        </div>
                      ) : null}
                      {isBlockedBySelected ? (
                        <div
                          role="status"
                          className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-200"
                        >
                          {m.blockedHint}
                        </div>
                      ) : null}

                      {showMessageComposer ? (
                        <div className="px-4">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder={
                                isBlockedBySelected
                                  ? m.blockedInputPlaceholder
                                  : m.typeMessage
                              }
                              value={messageText}
                              disabled={isBlockedBySelected}
                              onChange={(e) => setMessageText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  void handleSend();
                                }
                              }}
                              className="bg-background py-2.5"
                            />
                            <Button
                              type="button"
                              className="shrink-0 bg-gradient-to-r from-blue-500 to-blue-700 text-white"
                              onClick={() => void handleSend()}
                              disabled={isBlockedBySelected || !messageText.trim()}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="px-4 text-center text-xs leading-snug text-muted-foreground">
                          {m.composerReadOnlyHint}
                        </div>
                      )}
                  </div>
                </>
              ) : newThreadDraft ? (
                <>
                  <div className="chat-header border-b border-border bg-card">
                  <div className="flex shrink-0 items-center justify-between border-b border-border p-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <button
                        type="button"
                        className="mr-1 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent sm:hidden"
                        onClick={() => {
                          userClosedConversationPaneRef.current = true;
                          setNewThreadDraft(null);
                          setSelectedOtherUserId(null);
                          setDraftFirstMessage("");
                          setChatActionError(null);
                          clearStoredOpenNavIntent();
                        }}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      {userAvatarById[newThreadDraft.otherUserId.trim().toLowerCase()] ? (
                        <img
                          src={userAvatarById[newThreadDraft.otherUserId.trim().toLowerCase()]}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
                          aria-hidden
                        >
                          {initialsFromFullName(newThreadDraft.otherName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="truncate text-foreground">
                          {newThreadDraft.otherName}
                        </h3>
                        <p className="truncate text-xs text-muted-foreground">
                          {newThreadDraft.skill.title}
                        </p>
                      </div>
                    </div>
                  </div>
                  </div>

                  <div className="messages-container p-4">
                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                      {m.newThreadIntro}
                    </p>
                    {chatActionError ? (
                      <div
                        role="alert"
                        className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                      >
                        {chatActionError}
                      </div>
                    ) : null}
                    {isNewThreadBlockedByOther ? (
                      <p className="text-sm text-amber-900 dark:text-amber-200">
                        {m.blockedHint}
                      </p>
                    ) : (
                      <div className="flex min-h-0 flex-1 flex-col gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="new-thread-first-msg">
                            {m.newThreadMessageLabel}
                          </Label>
                          <Textarea
                            id="new-thread-first-msg"
                            rows={5}
                            className="min-h-[7.5rem] resize-y bg-background"
                            placeholder={m.newThreadPlaceholder}
                            value={draftFirstMessage}
                            disabled={draftSubmitting}
                            onChange={(e) => setDraftFirstMessage(e.target.value)}
                          />
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {m.newThreadScheduleHint}
                        </p>
                      </div>
                    )}
                  </div>
                  {!isNewThreadBlockedByOther ? (
                    <div className="chat-input border-t border-border bg-card px-4 pt-[12px] pb-[max(12px,env(safe-area-inset-bottom))]">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          className="bg-gradient-to-r from-blue-500 to-blue-700 text-white"
                          disabled={
                            draftSubmitting || !draftFirstMessage.trim()
                          }
                          onClick={() => void handleSubmitNewThreadDraft()}
                        >
                          {draftSubmitting ? t.common.loading : m.newThreadSubmit}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={draftSubmitting}
                          onClick={() =>
                            navigate(PATHS.skill(newThreadDraft.skill.id))
                          }
                        >
                          {m.newThreadPickTimeOnSkillPage}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
                  {chatActionError ? (
                    <div
                      role="alert"
                      className="mb-2 max-w-md rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    >
                      {chatActionError}
                    </div>
                  ) : null}
                  <MessageCircle className="h-12 w-12 text-muted-foreground/40" />
                  <h3 className="text-lg text-foreground">
                    {m.emptyThreadTitle}
                  </h3>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    {m.emptyThreadBody}
                  </p>
                </div>
              )}
            </div>
          </Card>
          </div>
        </div>
      </div>
      <Modal
        open={cancelOpen}
        onOpenChange={(open) => {
          setCancelOpen(open);
          if (!open) setCancelError(null);
        }}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{m.cancelConfirmTitle}</ModalTitle>
            <ModalDescription>
              <span className="whitespace-pre-line block text-sm text-muted-foreground">
                {m.cancelConfirmBody}
              </span>
            </ModalDescription>
          </ModalHeader>
          {cancelError ? (
            <div
              role="alert"
              className="-mt-1 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {cancelError}
            </div>
          ) : null}
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCancelOpen(false);
                setCancelError(null);
              }}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleCancelExchange()}
            >
              {selected?.uiStatus === "pending-outgoing" ? m.cancelPending : m.cancelSession}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        open={blockConfirmOpen}
        onOpenChange={(open) => {
          if (blockConfirmPending) return;
          setBlockConfirmOpen(open);
        }}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{m.blockConfirmTitle}</ModalTitle>
            <ModalDescription>
              <span className="block whitespace-pre-line text-sm text-muted-foreground">
                {m.blockConfirmBody}
              </span>
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              disabled={blockConfirmPending}
              onClick={() => setBlockConfirmOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={blockConfirmPending}
              onClick={() => void confirmBlockSelectedUser()}
            >
              {m.blockConfirmAction}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={bookOpen} onOpenChange={handleBookModalOpenChange}>
        <ModalContent className="flex flex-col">
          <ModalHeader>
            <ModalTitle>{m.bookModalTitle}</ModalTitle>
          </ModalHeader>
          <div className="space-y-4">
            {bookingMetaSummary ? (
              <div className="flex flex-wrap gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
                {bookingMetaSummary.metaSessionType ? (
                  <Badge variant="secondary">{bookingMetaSummary.metaSessionType}</Badge>
                ) : null}
                {bookingMetaSummary.metaDays ? (
                  <Badge variant="secondary">{bookingMetaSummary.metaDays}</Badge>
                ) : null}
                {bookingMetaSummary.metaTime ? (
                  <Badge variant="secondary">{bookingMetaSummary.metaTime}</Badge>
                ) : null}
                {bookingMetaSummary.metaLocation ? (
                  <Badge variant="secondary">{bookingMetaSummary.metaLocation}</Badge>
                ) : null}
              </div>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {formatTemplate(m.bookHint, {
                minutes: String(selected?.ex.bookedMinutes ?? 0),
              })}
            </p>
            {hasBookingAvailabilityConstraints ? (
              <p className="text-sm text-muted-foreground">{sd.bookScheduleHint}</p>
            ) : null}
            {hasBookingAvailabilityConstraints &&
            bookingDateOptions.length === 0 &&
            bookingSkillReady ? (
              <p className="text-sm text-destructive">{sd.bookNoSlots}</p>
            ) : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {studentDateTimeLoading ? (
                <div className="sm:col-span-2 rounded-lg border border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                  {t.common.loading}
                </div>
              ) : hasBookingAvailabilityConstraints ? (
                <>
                  <div>
                    <Label htmlFor="msg-book-date-trigger">{m.bookDateLabel}</Label>
                    <Popover
                      open={bookDatePopoverOpen}
                      onOpenChange={(open) => {
                        setBookDatePopoverOpen(open);
                        if (open) setBookCalendarMonth(ymdToLocalDate(bookDate));
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          id="msg-book-date-trigger"
                          type="button"
                          variant="outline"
                          className={cn(
                            "mt-2 flex h-10 w-full items-center justify-between px-3 font-normal",
                          )}
                        >
                          <span className="truncate text-left">{bookDateDisplayLabel}</span>
                          <CalendarIcon className="ml-2 size-4 shrink-0 opacity-70" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        side="bottom"
                        sideOffset={6}
                        collisionPadding={16}
                        className="w-80 min-w-[18rem] max-h-[min(26rem,calc(100dvh-6rem))] max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain border-border p-2 shadow-lg"
                      >
                        {bookError ? (
                          <div
                            role="alert"
                            aria-live="assertive"
                            className="mb-2 flex items-start gap-2 rounded-md border border-red-600 bg-red-50 px-2 py-2 text-xs font-medium leading-snug text-red-900 dark:border-red-500 dark:bg-red-950/70 dark:text-red-100"
                          >
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                            <span>{bookError}</span>
                          </div>
                        ) : null}
                        <Calendar
                          mode="single"
                          locale={locale === "tr" ? trLocale : enUS}
                          weekStartsOn={locale === "tr" ? 1 : 0}
                          month={bookCalendarMonth}
                          onMonthChange={setBookCalendarMonth}
                          selected={ymdToLocalDate(bookDate)}
                          onSelect={(d) => {
                            if (d) {
                              setBookError(null);
                              setBookDate(dateToYmd(d));
                              setBookCalendarMonth(d);
                              setBookDatePopoverOpen(false);
                            }
                          }}
                          disabled={(date) => !bookableYmdSet.has(dateToYmd(date))}
                          startMonth={calendarMonthBounds.startMonth}
                          endMonth={calendarMonthBounds.endMonth}
                          defaultMonth={ymdToLocalDate(bookDate)}
                          className="p-0"
                          classNames={{
                            root: "border-0 bg-transparent shadow-none",
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="msg-book-time">{m.bookTimeLabel}</Label>
                    {bookingTimeOptions.length > 0 ? (
                      <Select
                        value={
                          bookingTimeOptions.includes(bookTime)
                            ? bookTime
                            : bookingTimeOptions[0]
                        }
                        onValueChange={(v) => {
                          setBookError(null);
                          setBookTime(v);
                        }}
                      >
                        <SelectTrigger id="msg-book-time" className="mt-2 w-full">
                          <SelectValue placeholder={m.bookTimeLabel} />
                        </SelectTrigger>
                        <SelectContent>
                          {bookingTimeOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">{sd.bookNoSlots}</p>
                    )}
                  </div>
                </>
              ) : studentFallbackDateTimeInputs ? (
                <>
                  <div className="min-w-0">
                    <Label htmlFor="msg-book-date-fallback">{m.bookDateLabel}</Label>
                    <Input
                      id="msg-book-date-fallback"
                      type="date"
                      className="mt-2"
                      value={bookDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => {
                        setBookError(null);
                        setBookDate(e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="msg-book-time-fallback">{m.bookTimeLabel}</Label>
                    <Input
                      id="msg-book-time-fallback"
                      type="time"
                      className="mt-2"
                      value={bookTime}
                      onChange={(e) => {
                        setBookError(null);
                        setBookTime(e.target.value);
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="msg-book-date-trigger">{m.bookDateLabel}</Label>
                    <Popover
                      open={bookDatePopoverOpen}
                      onOpenChange={(open) => {
                        setBookDatePopoverOpen(open);
                        if (open) setBookCalendarMonth(ymdToLocalDate(bookDate));
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          id="msg-book-date-trigger"
                          type="button"
                          variant="outline"
                          className={cn(
                            "mt-2 flex h-10 w-full items-center justify-between px-3 font-normal",
                          )}
                        >
                          <span className="truncate text-left">{bookDateDisplayLabel}</span>
                          <CalendarIcon className="ml-2 size-4 shrink-0 opacity-70" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        side="bottom"
                        sideOffset={6}
                        collisionPadding={16}
                        className="w-80 min-w-[18rem] max-h-[min(26rem,calc(100dvh-6rem))] max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain border-border p-2 shadow-lg"
                      >
                        {bookError ? (
                          <div
                            role="alert"
                            aria-live="assertive"
                            className="mb-2 flex items-start gap-2 rounded-md border border-red-600 bg-red-50 px-2 py-2 text-xs font-medium leading-snug text-red-900 dark:border-red-500 dark:bg-red-950/70 dark:text-red-100"
                          >
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                            <span>{bookError}</span>
                          </div>
                        ) : null}
                        <Calendar
                          mode="single"
                          locale={locale === "tr" ? trLocale : enUS}
                          weekStartsOn={locale === "tr" ? 1 : 0}
                          month={bookCalendarMonth}
                          onMonthChange={setBookCalendarMonth}
                          selected={ymdToLocalDate(bookDate)}
                          onSelect={(d) => {
                            if (d) {
                              setBookError(null);
                              setBookDate(dateToYmd(d));
                              setBookCalendarMonth(d);
                              setBookDatePopoverOpen(false);
                            }
                          }}
                          disabled={[
                            { before: bookDateMin },
                            { after: bookDateMax },
                          ]}
                          defaultMonth={ymdToLocalDate(bookDate)}
                          className="p-0"
                          classNames={{
                            root: "border-0 bg-transparent shadow-none",
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="msg-book-time">{m.bookTimeLabel}</Label>
                    <Input
                      id="msg-book-time"
                      type="time"
                      className="mt-2"
                      value={bookTime}
                      onChange={(e) => {
                        setBookError(null);
                        setBookTime(e.target.value);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
            <div>
              <Label htmlFor="msg-book-note">{m.bookMessageLabel}</Label>
              <Textarea
                id="msg-book-note"
                className="mt-2 min-h-24"
                value={bookMessage}
                onChange={(e) => setBookMessage(e.target.value)}
                placeholder={m.bookMessagePlaceholder}
              />
            </div>
          </div>
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              disabled={bookSubmitting}
              onClick={() => closeBookModal()}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white"
              onClick={() => void handleCreateBooking()}
              disabled={
                bookSubmitting ||
                (studentUsesSkillAvailability && !bookingSkillReady) ||
                (hasBookingAvailabilityConstraints &&
                  (bookingDateOptions.length === 0 ||
                    bookingTimeOptions.length === 0))
              }
            >
              {bookSubmitting ? t.common.loading : m.bookSubmit}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {bookOpen && bookError
        ? createPortal(
            <div
              role="alert"
              aria-live="assertive"
              className="pointer-events-none fixed inset-x-0 top-[max(5rem,env(safe-area-inset-top,0px))] z-[2100] flex justify-center px-4"
            >
              <div className="pointer-events-auto flex w-full max-w-lg items-start gap-2 rounded-lg border-2 border-red-600 bg-red-50 px-4 py-3 text-sm font-medium text-red-900 shadow-xl dark:border-red-500 dark:bg-red-950/90 dark:text-red-100">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <span>{bookError}</span>
              </div>
            </div>,
            document.body,
          )
        : null}
    </PageLayout>
  );
}
