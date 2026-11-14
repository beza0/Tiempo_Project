import { compactDays, compactTimeRange } from "../lib/availabilityLabel";
import { PageLayout } from "../components/layout/PageLayout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { cn } from "../components/ui/utils";
import { enUS, tr as trLocale } from "react-day-picker/locale";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
} from "../components/ui/modal";
import {
  Star,
  Clock,
  Video,
  MessageCircle,
  CalendarIcon,
  ChevronLeft,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import "../styles/skill-detail.css";
import type { PageType } from "../App";
import { useParams } from "react-router-dom";
import { PATHS } from "../navigation/paths";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { formatTemplate } from "../language";
import { useEffect, useMemo, useState } from "react";
import { fetchSkillById, type SkillDto } from "../api/skills";
import { fetchMyProfile } from "../api/user";
import {
  createExchangeRequest,
  fetchReceivedExchangeRequests,
  type ExchangeRequestDto,
} from "../api/exchange";
import { apiErrorDisplayMessage } from "../api/client";
import { initialsFromFullName } from "../lib/initials";
import { ImageWithFallback } from "../components/common/ImageWithFallback";
import { resolveSkillCoverImageUrl, skillCoverImageFallbackUrl } from "../lib/skillCoverImageUrl";

interface SkillDetailPageProps {
  onNavigate?: (page: PageType) => void;
  /** Book için oturum yokken girişe git; giriş sonrası bu sayfaya dönmek için App kullanır */
  onLoginRequired?: () => void;
}

function descriptionMain(desc: string): string {
  const sep = "\n\n———\n";
  const i = desc.indexOf(sep);
  return (i >= 0 ? desc.slice(0, i) : desc).trim();
}

function descriptionMeta(desc: string): string {
  const sep = "\n\n———\n";
  const i = desc.indexOf(sep);
  return i >= 0 ? desc.slice(i + sep.length).trim() : "";
}

function tomorrowDateStr(): string {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return t.toISOString().slice(0, 10);
}

/** Yerel tarih + saat → ISO (UTC) string */
function localDateTimeToUtcIso(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const parts = timeStr.split(":");
  const hh = Number(parts[0] ?? 0);
  const mm = Number(parts[1] ?? 0);
  const local = new Date(y, m - 1, d, hh, mm, 0, 0);
  return local.toISOString();
}

function isWithinAvailability(skill: SkillDto, dateStr: string, timeStr: string): boolean {
  const days = skill.availableDays ?? [];
  const from = skill.availableFrom;
  const until = skill.availableUntil;
  if (!days.length || !from || !until) return true;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dayKeys = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const weekday = dayKeys[new Date(y, m - 1, d).getDay()];
  if (!days.includes(weekday)) return false;
  return timeStr >= from && timeStr < until;
}

function parseMetaField(meta: string, labels: string[]): string | null {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`${escaped}\\s*:\\s*([^\\n]+)`, "i");
    const m = meta.match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return null;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function pad2(v: number): string {
  return String(v).padStart(2, "0");
}

function dateToYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Yerel öğlen — timezone kayması olmadan takvim seçimi */
function ymdToLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function buildHalfHourSlots(from: string, until: string): string[] {
  const out: string[] = [];
  let cur = toMinutes(from);
  const end = toMinutes(until);
  while (cur < end) {
    const h = Math.floor(cur / 60);
    const m = cur % 60;
    out.push(`${pad2(h)}:${pad2(m)}`);
    cur += 30;
  }
  return out;
}

const BOOKING_HORIZON_DAYS = 365;

export function SkillDetailPage({
  onNavigate,
  onLoginRequired,
}: SkillDetailPageProps) {
  const { skillId: paramSkillId } = useParams<{ skillId: string }>();
  const skillId: string | null = paramSkillId?.trim() ? paramSkillId : null;
  const { t, locale } = useLanguage();
  const { user, token } = useAuth();
  const s = t.skillDetail;
  const b = t.browse;
  const [skill, setSkill] = useState<SkillDto | null>(null);
  const [receivedTeachingForSkill, setReceivedTeachingForSkill] = useState<
    ExchangeRequestDto[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [bookMessage, setBookMessage] = useState("");
  const [bookSubmitting, setBookSubmitting] = useState(false);
  const [bookSuccess, setBookSuccess] = useState(false);
  const [bookErr, setBookErr] = useState<string | null>(null);
  const [bookDate, setBookDate] = useState(() => tomorrowDateStr());
  const [bookTime, setBookTime] = useState("10:00");
  const [bookDurationMinutes, setBookDurationMinutes] = useState("60");
  const [myTimeCreditMinutes, setMyTimeCreditMinutes] = useState<number>(0);
  const [bookDatePopoverOpen, setBookDatePopoverOpen] = useState(false);
  const [bookCalendarMonth, setBookCalendarMonth] = useState<Date>(() =>
    ymdToLocalDate(tomorrowDateStr()),
  );

  useEffect(() => {
    if (!skillId) {
      setSkill(null);
      return;
    }
    let c = false;
    setLoading(true);
    fetchSkillById(skillId)
      .then((data) => {
        if (!c) setSkill(data);
      })
      .catch(() => {
        if (!c) setSkill(null);
      })
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, [skillId]);

  useEffect(() => {
    const ownerId = skill?.ownerId;
    const currentSkillId = skill?.id;
    if (!token || !ownerId || !currentSkillId || !user?.id || ownerId !== user.id) {
      setReceivedTeachingForSkill([]);
      return;
    }
    let cancelled = false;
    fetchReceivedExchangeRequests(token)
      .then((list) => {
        if (cancelled) return;
        setReceivedTeachingForSkill(
          list.filter(
            (req) =>
              req.skillId === currentSkillId &&
              (req.status === "ACCEPTED" || req.status === "COMPLETED"),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setReceivedTeachingForSkill([]);
      });
    return () => {
      cancelled = true;
    };
  }, [token, skill?.id, skill?.ownerId, user?.id]);

  useEffect(() => {
    setBookMessage("");
    setBookSuccess(false);
    setBookErr(null);
    setBookDate(tomorrowDateStr());
    setBookTime("10:00");
    setBookDurationMinutes("60");
    setMyTimeCreditMinutes(0);
    setBookCalendarMonth(ymdToLocalDate(tomorrowDateStr()));
  }, [skillId]);

  useEffect(() => {
    if (!token) {
      setMyTimeCreditMinutes(0);
      return;
    }
    let cancelled = false;
    fetchMyProfile(token)
      .then((profile) => {
        if (!cancelled) {
          setMyTimeCreditMinutes(profile.timeCreditMinutes);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMyTimeCreditMinutes(0);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const hasAvailabilityConstraints = useMemo(
    () =>
      Boolean(skill?.availableDays?.length) &&
      Boolean(skill?.availableFrom) &&
      Boolean(skill?.availableUntil),
    [skill],
  );

  const allowedDays = useMemo(
    () => new Set(skill?.availableDays ?? []),
    [skill?.availableDays],
  );

  const dateOptions = useMemo(() => {
    if (
      !skill ||
      !hasAvailabilityConstraints ||
      !skill.availableFrom ||
      !skill.availableUntil
    ) {
      return [];
    }
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    const minMs = now.getTime() + 60 * 60 * 1000;
    const dayKeys = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    const baseSlots = buildHalfHourSlots(skill.availableFrom, skill.availableUntil);
    for (let i = 0; i < BOOKING_HORIZON_DAYS; i++) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + i);
      const dayCode = dayKeys[d.getDay()];
      if (!allowedDays.has(dayCode)) continue;
      const ymd = dateToYmd(d);
      const validSlotExists = baseSlots.some((slot) => {
        const candidate = new Date(`${ymd}T${slot}:00`);
        return candidate.getTime() >= minMs;
      });
      if (!validSlotExists) continue;
      options.push({
        value: ymd,
        label: d.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      });
    }
    return options;
  }, [
    skill,
    hasAvailabilityConstraints,
    allowedDays,
    locale,
  ]);

  const bookableYmdSet = useMemo(
    () => new Set(dateOptions.map((o) => o.value)),
    [dateOptions],
  );

  const bookDateDisplayLabel = useMemo(() => {
    const opt = dateOptions.find((o) => o.value === bookDate);
    if (opt) return opt.label;
    return ymdToLocalDate(bookDate).toLocaleDateString(
      locale === "tr" ? "tr-TR" : "en-US",
      {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      },
    );
  }, [dateOptions, bookDate, locale]);

  const calendarMonthBounds = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + BOOKING_HORIZON_DAYS);
    return {
      startMonth: new Date(start.getFullYear(), start.getMonth(), 1),
      endMonth: new Date(end.getFullYear(), end.getMonth(), 1),
    };
  }, []);

  const timeOptions = useMemo(() => {
    if (
      !skill ||
      !hasAvailabilityConstraints ||
      !skill.availableFrom ||
      !skill.availableUntil ||
      !bookDate
    ) {
      return [];
    }
    const minMs = Date.now() + 60 * 60 * 1000;
    return buildHalfHourSlots(skill.availableFrom, skill.availableUntil).filter((slot) => {
      const candidate = new Date(`${bookDate}T${slot}:00`);
      return candidate.getTime() >= minMs;
    });
  }, [
    skill,
    hasAvailabilityConstraints,
    bookDate,
  ]);

  const durationOptions = useMemo(() => {
    const byCredit = Math.floor(myTimeCreditMinutes / 30) * 30;
    if (byCredit < 30) return [];

    let maxAllowed = byCredit;
    if (hasAvailabilityConstraints && skill?.availableUntil) {
      const remainingInWindow = toMinutes(skill.availableUntil) - toMinutes(bookTime);
      maxAllowed = Math.min(maxAllowed, Math.floor(remainingInWindow / 30) * 30);
    }

    if (maxAllowed < 30) return [];
    const out: string[] = [];
    for (let m = 30; m <= maxAllowed; m += 30) {
      out.push(String(m));
    }
    return out;
  }, [
    myTimeCreditMinutes,
    hasAvailabilityConstraints,
    skill?.availableUntil,
    bookTime,
  ]);

  useEffect(() => {
    if (!hasAvailabilityConstraints) return;
    if (dateOptions.length === 0) return;
    if (!dateOptions.some((d) => d.value === bookDate)) {
      setBookDate(dateOptions[0].value);
    }
  }, [hasAvailabilityConstraints, dateOptions, bookDate]);

  useEffect(() => {
    if (!hasAvailabilityConstraints) return;
    if (timeOptions.length === 0) return;
    if (!timeOptions.includes(bookTime)) {
      setBookTime(timeOptions[0]);
    }
  }, [hasAvailabilityConstraints, timeOptions, bookTime]);

  useEffect(() => {
    if (durationOptions.length === 0) return;
    if (!durationOptions.includes(bookDurationMinutes)) {
      const preferred = durationOptions.includes("60") ? "60" : durationOptions[0];
      setBookDurationMinutes(preferred);
    }
  }, [durationOptions, bookDurationMinutes]);

  const learnersCountForOwner = useMemo(
    () => new Set(receivedTeachingForSkill.map((b) => b.requesterId)).size,
    [receivedTeachingForSkill],
  );

  const handleBookClick = () => {
    setBookErr(null);
    if (!token) {
      if (onLoginRequired) {
        onLoginRequired();
      } else {
        onNavigate?.("login");
      }
      return;
    }
    setBookOpen(true);
  };

  const handleMessageInstructorClick = () => {
    if (!skill) return;
    const ownerId = skill.ownerId?.trim();
    const sid = skill.id?.trim();
    if (!ownerId || !sid) return;
    if (!token) {
      if (onLoginRequired) {
        onLoginRequired();
      } else {
        onNavigate?.("login");
      }
      return;
    }
    try {
      sessionStorage.setItem("tiempos_open_user", ownerId);
      sessionStorage.setItem("tiempos_open_skill", sid);
    } catch {
      /* ignore */
    }
    const qs = new URLSearchParams({ user: ownerId, skill: sid });
    /** Tam sayfa geçişi: client-side route değişiminde intent ilk frame’de kaybolabiliyor */
    window.location.assign(`${PATHS.messages}?${qs.toString()}`);
  };

  const handleBookModalChange = (open: boolean) => {
    if (!open && bookSubmitting) return;
    setBookOpen(open);
    if (!open) {
      setBookErr(null);
      setBookDatePopoverOpen(false);
    }
  };

  const handleBookDatePopoverOpenChange = (open: boolean) => {
    setBookDatePopoverOpen(open);
    if (open) {
      setBookCalendarMonth(ymdToLocalDate(bookDate));
    }
  };

  const submitBookRequest = async () => {
    if (!token || !skill) return;
    if (hasAvailabilityConstraints) {
      if (!bookDate || !bookTime || !timeOptions.includes(bookTime)) {
        setBookErr(s.bookOutsideAvailability);
        return;
      }
      if (dateOptions.length === 0) {
        setBookErr(s.bookNoSlots);
        return;
      }
    }
    if (durationOptions.length === 0 || !durationOptions.includes(bookDurationMinutes)) {
      setBookErr(s.bookNotEnoughCredits);
      return;
    }
    setBookSubmitting(true);
    setBookErr(null);
    const scheduledStartAt = localDateTimeToUtcIso(bookDate, bookTime);
    const bookedMinutes = Number(bookDurationMinutes);
    const minMs = Date.now() + 60 * 60 * 1000;
    if (new Date(scheduledStartAt).getTime() < minMs) {
      setBookErr(s.bookTooSoon);
      setBookSubmitting(false);
      return;
    }
    if (!isWithinAvailability(skill, bookDate, bookTime)) {
      setBookErr(s.bookOutsideAvailability);
      setBookSubmitting(false);
      return;
    }
    try {
      const created = await createExchangeRequest(token, skill.id, {
        message: bookMessage.trim() || s.bookDefaultMessage,
        bookedMinutes,
        scheduledStartAt,
      });
      try {
        sessionStorage.setItem("tiempos_open_exchange", created.id);
      } catch {
        /* ignore */
      }
      setBookSuccess(true);
      setBookErr(null);
      setBookOpen(false);
      setBookMessage("");
      onNavigate?.("messages");
    } catch (err) {
      setBookErr(apiErrorDisplayMessage(err, s.bookError));
    } finally {
      setBookSubmitting(false);
    }
  };

  if (!skillId) {
    return (
      <PageLayout onNavigate={onNavigate}>
        <div className="pt-28 pb-20 px-4 text-center">
          <p className="text-muted-foreground mb-6">{s.pickBrowse}</p>
          <Button
            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white"
            onClick={() => onNavigate?.("browse")}
          >
            {s.backToBrowse}
          </Button>
        </div>
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout onNavigate={onNavigate}>
        <div className="pt-28 pb-20 px-4 text-center text-muted-foreground">
          {s.loading}
        </div>
      </PageLayout>
    );
  }

  if (!skill) {
    return (
      <PageLayout onNavigate={onNavigate}>
        <div className="pt-28 pb-20 px-4 text-center">
          <p className="text-muted-foreground mb-6">{s.notFound}</p>
          <Button variant="outline" onClick={() => onNavigate?.("browse")}>
            {s.backToBrowse}
          </Button>
        </div>
      </PageLayout>
    );
  }

  const catKey = skill.category?.trim() || "Programming";
  const categoryLabel =
    b.categoryLabels[catKey as keyof typeof b.categoryLabels] ??
    catKey ??
    s.categoryProgramming;
  const coverImageSrc = resolveSkillCoverImageUrl(skill);
  const mainDesc = descriptionMain(skill.description);
  const metaBlock = descriptionMeta(skill.description);
  const metaSessionType =
    (skill.sessionTypes?.length
      ? skill.sessionTypes
          .map((v) => (v === "in-person" ? t.addSkill.inPerson : t.addSkill.online))
          .join(", ")
      : null) ??
    parseMetaField(metaBlock, ["Session Type *", "Oturum türü *"]);
  const metaLocation =
    skill.inPersonLocation ??
    parseMetaField(metaBlock, ["Location", "Konum"]);
  const metaDays =
    (skill.availableDays?.length
      ? compactDays(skill.availableDays, {
          short: b.dayShort,
          everyDay: b.everyDay,
          weekdays: b.weekdays,
          weekend: b.weekend,
        })
      : null) ??
    parseMetaField(metaBlock, ["Available Days *", "Müsait günler *"]);
  const metaTime =
    skill.availableFrom && skill.availableUntil
      ? compactTimeRange(skill.availableFrom, skill.availableUntil)
      : parseMetaField(
          metaBlock,
          ["Available From *– Available Until *", "Başlangıç *–Bitiş *"],
        );
  const levelKey = (skill.level ?? "").trim().toLowerCase();
  const levelMap: Record<string, string> = {
    beginner: t.addSkill.levelBeginner,
    intermediate: t.addSkill.levelIntermediate,
    advanced: t.addSkill.levelAdvanced,
    expert: t.addSkill.levelExpert,
  };
  // Seviye, arayüz diline çevrilir (önceden TR arayüzde "Intermediate" görünüyordu).
  const levelLabel = levelKey
    ? levelMap[levelKey] ?? levelKey.charAt(0).toUpperCase() + levelKey.slice(1)
    : "";

  const isOwnListing =
    Boolean(user?.id) && skill.ownerId === user?.id;

  const perSessionLabel = formatTemplate(s.perSession, {
    n: String(skill.durationMinutes > 0 ? skill.durationMinutes : 60),
  });
  // Gün ve saat birlikte: "Her gün · 09:00–21:00" (önceden yalnızca biri gösteriliyordu).
  const scheduleSummary =
    [metaDays?.trim(), metaTime?.trim()].filter(Boolean).join(" · ") || "—";

  const metaVenueLine =
    [metaSessionType?.trim(), metaLocation?.trim()].filter(Boolean).join(" · ") ||
    "—";
  const VenueIcon = metaLocation?.trim() ? MapPin : Video;

  const dm = skill.durationMinutes > 0 ? skill.durationMinutes : 60;
  const hourUnit = locale === "tr" ? "sa" : "h";
  const minUnit = locale === "tr" ? "dk" : "min";
  const sessionHoursDisplay =
    dm >= 60 && dm % 60 === 0
      ? `${dm / 60} ${hourUnit}`
      : dm >= 60
        ? `${Math.floor(dm / 60)} ${hourUnit} ${dm % 60} ${minUnit}`
        : `${dm} ${minUnit}`;

  const heroTagBadges = [
    levelLabel,
    ...(metaSessionType
      ? metaSessionType.split(",").map((x) => x.trim()).filter(Boolean)
      : []),
  ].filter((x, i, a) => Boolean(x) && a.indexOf(x) === i).slice(0, 5);

  return (
    <PageLayout onNavigate={onNavigate}>
      <div className="skill-detail-page">
        <div className="sd-hero-wrap">
          <div className="sd-hero-inner-max">
            <button
              type="button"
              className="sd-back-button"
              onClick={() => onNavigate?.("browse")}
            >
              <ChevronLeft aria-hidden />
              {s.backToBrowse}
            </button>
            <div className="sd-hero-content">
              <div className="sd-hero-image-container">
                <ImageWithFallback
                  key={skill.id}
                  src={coverImageSrc}
                  alt={skill.title}
                  loading="eager"
                  fallbackSrc={skillCoverImageFallbackUrl(skill)}
                  errorFallback={
                    <div className="tp-cover-placeholder flex h-full w-full items-center justify-center" aria-hidden>
                      <span className="text-7xl font-semibold text-white/90">
                        {skill.title.trim().charAt(0).toLocaleUpperCase("tr-TR")}
                      </span>
                    </div>
                  }
                  className="sd-hero-image"
                />
              </div>
              <div className="sd-hero-info">
                <span className="sd-category-badge">{categoryLabel}</span>
                <div className="sd-hero-title-row">
                  <h1 className="sd-skill-title">{skill.title}</h1>
                  <div className="sd-instructor-info sd-instructor-info--inline">
                    <div
                      className="sd-instructor-avatar sd-instructor-avatar--initials"
                      aria-hidden
                    >
                      {initialsFromFullName(skill.ownerName)}
                    </div>
                    <div className="sd-instructor-text">
                      <p className="sd-instructor-label">{s.instructor}</p>
                      <p className="sd-instructor-name">{skill.ownerName}</p>
                      {/* Öğrenci sayısı yalnızca ilan sahibine bilinir; başkalarına her zaman "0" gösteriliyordu */}
                      {isOwnListing ? (
                        <p className="sd-students-line">
                          {formatTemplate(s.studentsCount, {
                            n: String(learnersCountForOwner),
                          })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
                <p className="sd-skill-description">
                  {(mainDesc || s.learnEmpty).trim() || s.learnEmpty}
                </p>
                <div className="sd-meta-info">
                  <div className="sd-meta-item">
                    <Star className="sd-meta-icon sd-meta-icon--star" />
                    <span>{s.noReviews}</span>
                  </div>
                  <div className="sd-meta-item">
                    <Clock className="sd-meta-icon" />
                    <span>{perSessionLabel}</span>
                  </div>
                  <div className="sd-meta-item">
                    <VenueIcon className="sd-meta-icon" />
                    <span className="min-w-0">{metaVenueLine}</span>
                  </div>
                  <div className="sd-meta-item">
                    <CalendarIcon className="sd-meta-icon" />
                    <span className="min-w-0">{scheduleSummary}</span>
                  </div>
                </div>
                {heroTagBadges.length > 0 ? (
                  <div className="sd-tags-container">
                    {heroTagBadges.map((tag) => (
                      <Badge key={tag} variant="secondary" className="sd-tag">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {!isOwnListing ? (
                  <>
                    <div className="sd-divider-before-actions">
                      {bookSuccess ? (
                        <p className="sd-book-success">{s.bookSuccess}</p>
                      ) : null}
                      <div className="sd-action-buttons">
                        <Button
                          type="button"
                          className="sd-book-button"
                          onClick={handleBookClick}
                        >
                          {token ? s.bookSession : s.bookLogin}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="sd-message-button"
                          onClick={handleMessageInstructorClick}
                        >
                          <MessageCircle className="mr-2 h-5 w-5 shrink-0" />
                          {s.messageInstructor}
                        </Button>
                      </div>
                    </div>
                    <div className="sd-price-info">
                      <div className="sd-price-amount">{sessionHoursDisplay}</div>
                      <div className="sd-price-label">{s.heroPricingCaption}</div>
                    </div>
                  </>
                ) : (
                  <p className="sd-own-hint">{s.ownListingHint}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {skill && !isOwnListing ? (
        <Modal open={bookOpen} onOpenChange={handleBookModalChange}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>{s.bookModalTitle}</ModalTitle>
            </ModalHeader>
            <div className="space-y-4">
              {hasAvailabilityConstraints ? (
                <div className="flex flex-wrap gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
                  {metaSessionType ? <Badge variant="secondary">{metaSessionType}</Badge> : null}
                  {metaDays ? <Badge variant="secondary">{metaDays}</Badge> : null}
                  {metaTime ? <Badge variant="secondary">{metaTime}</Badge> : null}
                  {metaLocation ? <Badge variant="secondary">{metaLocation}</Badge> : null}
                </div>
              ) : null}
              <p className="text-sm text-muted-foreground">{s.bookScheduleHint}</p>
              {!bookDatePopoverOpen && bookErr ? (
                <div
                  className="flex items-start gap-2 rounded-md border-2 border-red-600 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-900 dark:border-red-500 dark:bg-red-950/60 dark:text-red-100"
                  role="alert"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{bookErr}</span>
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="min-w-0">
                  <Label htmlFor="book-date-trigger">{s.bookDateLabel}</Label>
                  {hasAvailabilityConstraints ? (
                    <Popover
                      open={bookDatePopoverOpen}
                      onOpenChange={handleBookDatePopoverOpenChange}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          id="book-date-trigger"
                          type="button"
                          variant="outline"
                          aria-expanded={bookDatePopoverOpen}
                          className={cn(
                            "mt-2 flex h-10 w-full min-w-0 items-center justify-between px-3 font-normal",
                          )}
                        >
                          <span className="truncate text-left">
                            {bookDateDisplayLabel}
                          </span>
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
                        {bookErr ? (
                          <div
                            className="mb-2 flex items-start gap-2 rounded-md border border-red-600 bg-red-50 px-2 py-2 text-xs font-medium leading-snug text-red-900 dark:border-red-500 dark:bg-red-950/70 dark:text-red-100"
                            role="alert"
                          >
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>{bookErr}</span>
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
                              setBookDate(dateToYmd(d));
                              setBookCalendarMonth(d);
                              setBookDatePopoverOpen(false);
                            }
                          }}
                          disabled={(date) => !bookableYmdSet.has(dateToYmd(date))}
                          defaultMonth={ymdToLocalDate(bookDate)}
                          startMonth={calendarMonthBounds.startMonth}
                          endMonth={calendarMonthBounds.endMonth}
                          className="p-0"
                          classNames={{
                            root: "border-0 bg-transparent shadow-none",
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Input
                      id="book-date"
                      type="date"
                      className="mt-2"
                      value={bookDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setBookDate(e.target.value)}
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="book-time">{s.bookTimeLabel}</Label>
                  {hasAvailabilityConstraints ? (
                    <Select value={bookTime} onValueChange={setBookTime}>
                      <SelectTrigger id="book-time" className="mt-2">
                        <SelectValue placeholder={s.bookTimeLabel} />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="book-time"
                      type="time"
                      className="mt-2"
                      value={bookTime}
                      onChange={(e) => setBookTime(e.target.value)}
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="book-duration">{s.bookDurationLabel}</Label>
                  <Select value={bookDurationMinutes} onValueChange={setBookDurationMinutes}>
                    <SelectTrigger id="book-duration" className="mt-2">
                      <SelectValue placeholder={s.bookDurationLabel} />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {`${opt} dk`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatTemplate(s.bookDurationHint, {
                  credits: String(Math.floor(myTimeCreditMinutes / 30) * 30),
                })}
              </p>
              {hasAvailabilityConstraints && dateOptions.length === 0 ? (
                <p className="text-sm text-destructive">{s.bookNoSlots}</p>
              ) : null}
              {durationOptions.length === 0 ? (
                <p className="text-sm text-destructive">{s.bookNotEnoughCredits}</p>
              ) : null}
              <div>
                <Label htmlFor="book-msg">{s.bookMessage}</Label>
                <Textarea
                  id="book-msg"
                  value={bookMessage}
                  onChange={(e) => setBookMessage(e.target.value)}
                  placeholder={s.bookMessagePh}
                  className="mt-2 min-h-24"
                  maxLength={1000}
                />
              </div>
            </div>
            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleBookModalChange(false)}
                disabled={bookSubmitting}
              >
                {t.common.cancel}
              </Button>
              <Button
                type="button"
                className="bg-gradient-to-r from-blue-500 to-blue-700 text-white"
                onClick={() => void submitBookRequest()}
                disabled={
                  bookSubmitting ||
                  (hasAvailabilityConstraints && dateOptions.length === 0) ||
                  durationOptions.length === 0
                }
              >
                {bookSubmitting ? t.common.loading : s.bookSubmit}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      ) : null}
    </PageLayout>
  );
}
