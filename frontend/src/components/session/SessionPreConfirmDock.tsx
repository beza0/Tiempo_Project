import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ChevronLeft, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatTemplate } from "../../language";
import { createReview, fetchPendingReviewsForDock, type PendingReviewDockDto } from "../../api/reviews";
import { StarRatingPicker } from "../review/StarRatingPicker";
import {
  fetchOpenPreSessionConfirmations,
  fetchPendingCancelSurveys,
  reportSessionProblem,
  submitCancelSurvey,
  submitPreSessionResponse,
  type CancelSurveyReasonCode,
  type ExchangeRequestDto,
  type PendingCancelSurveyDto,
} from "../../api/exchange";
import { apiErrorDisplayMessage } from "../../api/client";
import { fetchMyProfile } from "../../api/user";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { PATHS } from "../../navigation/paths";
import type { Translation } from "../../language/locale/en";

const POLL_MS = 8000;

type SessionPreDockStrings = Translation["sessionPreDock"];

function normEmail(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function iAmRequesterFor(
  ex: ExchangeRequestDto,
  myId: string | undefined,
  myEmail: string | undefined,
): boolean {
  if (myId) {
    if (ex.requesterId === myId) return true;
    if (ex.ownerId === myId) return false;
  }
  const em = normEmail(myEmail);
  if (em && normEmail(ex.requesterEmail) === em) return true;
  if (em && normEmail(ex.ownerEmail) === em) return false;
  return false;
}

function canResolveParticipant(
  ex: ExchangeRequestDto,
  myId: string | undefined,
  myEmail: string | undefined,
): boolean {
  if (myId && (ex.requesterId === myId || ex.ownerId === myId)) return true;
  const em = normEmail(myEmail);
  if (!em) return false;
  return normEmail(ex.requesterEmail) === em || normEmail(ex.ownerEmail) === em;
}

function formatSessionStart(iso: string | null | undefined, locale: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

function normResp(v: string | null | undefined): string {
  return (v ?? "").trim().toUpperCase();
}

function isCancelledStatus(status: string | undefined): boolean {
  return (status ?? "").trim().toUpperCase() === "CANCELLED";
}

function getOrCreateOverlayMount(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  let el = document.getElementById("tiempos-overlays");
  if (!el) {
    el = document.createElement("div");
    el.id = "tiempos-overlays";
    document.body.appendChild(el);
  }
  return el;
}

function labelForResponse(v: string | null | undefined, s: SessionPreDockStrings): string {
  const u = normResp(v);
  if (u === "") return s.statusPending;
  if (u === "CONFIRMED") return s.statusConfirmed;
  if (u === "DECLINED") return s.statusDeclined;
  return s.statusPending;
}

function youStatusLine(myNorm: string, s: SessionPreDockStrings): string {
  if (myNorm === "CONFIRMED") return s.youStatusConfirmed;
  if (myNorm === "DECLINED") return s.youStatusDeclined;
  return s.youStatusPending;
}

function peerStatusLine(theirNorm: string, s: SessionPreDockStrings): string {
  if (theirNorm === "CONFIRMED") return s.peerStatusConfirmed;
  if (theirNorm === "DECLINED") return s.peerStatusDeclined;
  return s.peerStatusPending;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function SessionCountdown({
  targetIso,
  label,
}: {
  targetIso: string;
  label: string;
}) {
  const [remaining, setRemaining] = useState(() => new Date(targetIso).getTime() - Date.now());

  useEffect(() => {
    const tick = () => setRemaining(new Date(targetIso).getTime() - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetIso]);

  return (
    <div className="tiempos-session-pre-dock-card__countdown" role="timer" aria-live="polite">
      <p className="tiempos-session-pre-dock-card__countdown-label">{label}</p>
      <p className="tiempos-session-pre-dock-card__countdown-value">{formatCountdown(remaining)}</p>
    </div>
  );
}

function toastAfterPreSessionDecision(
  updated: ExchangeRequestDto,
  decision: "CONFIRM" | "DECLINE",
  s: SessionPreDockStrings,
): void {
  if (updated.preSessionBothConfirmedAt && !updated.creditsSettledAt) {
    toast.success(s.toastBothReady, { description: updated.skillTitle, duration: 9000 });
    return;
  }
  if (isCancelledStatus(updated.status)) {
    const rq = normResp(updated.requesterPreSessionResponse);
    const ow = normResp(updated.ownerPreSessionResponse);
    if (rq === "DECLINED" && ow === "DECLINED") {
      toast.info(s.toastBothDeclined, { description: updated.skillTitle, duration: 9000 });
    } else {
      toast.info(s.toastCancelledConflict, { description: updated.skillTitle, duration: 9000 });
    }
    return;
  }
  if (decision === "CONFIRM") {
    toast.success(s.toastYouConfirmed, { description: updated.skillTitle });
  } else {
    toast.info(s.toastYouDeclined, { description: updated.skillTitle });
  }
}

/**
 * Seans öncesi çift onay: sağ altta kart; X ile sağ çubuk; çubuktan tekrar açılır.
 */
export function SessionPreConfirmDock() {
  const { token, user, patchUser, isAuthenticated } = useAuth();
  const { t, locale } = useLanguage();
  const s = t.sessionPreDock;
  const [rows, setRows] = useState<ExchangeRequestDto[]>([]);
  const [pendingFeedback, setPendingFeedback] = useState<PendingReviewDockDto[]>([]);
  const [pendingCancelSurveys, setPendingCancelSurveys] = useState<PendingCancelSurveyDto[]>([]);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<Record<string, number>>({});
  const [feedbackComment, setFeedbackComment] = useState<Record<string, string>>({});
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<string | null>(null);
  const [feedbackCommentOpen, setFeedbackCommentOpen] = useState<Record<string, boolean>>({});
  const [cancelReason, setCancelReason] = useState<Record<string, CancelSurveyReasonCode | "">>({});
  const [cancelNote, setCancelNote] = useState<Record<string, string>>({});
  const [cancelSubmitting, setCancelSubmitting] = useState<string | null>(null);
  const [problemText, setProblemText] = useState<Record<string, string>>({});
  const [reportingId, setReportingId] = useState<string | null>(null);
  const toastedRef = useRef<Set<string>>(new Set());
  const [minimized, setMinimized] = useState(false);
  const minimizedRef = useRef(minimized);
  const [overlayEl, setOverlayEl] = useState<HTMLElement | null>(null);

  minimizedRef.current = minimized;

  useLayoutEffect(() => {
    setOverlayEl(getOrCreateOverlayMount());
  }, []);

  useEffect(() => {
    if (!token) toastedRef.current.clear();
  }, [token]);

  useEffect(() => {
    if (!token || user?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const p = await fetchMyProfile(token);
        if (!cancelled && p?.id) {
          patchUser({ id: p.id });
        }
      } catch {
        /* sessiz */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, user?.id, patchUser]);

  const load = useCallback(async () => {
    if (!token) {
      setRows([]);
      return;
    }
    try {
      const [list, pending, cancelPending] = await Promise.all([
        fetchOpenPreSessionConfirmations(token),
        fetchPendingReviewsForDock(token),
        fetchPendingCancelSurveys(token),
      ]);
      setRows((prev) => {
        if (list.length > prev.length && minimizedRef.current) {
          setMinimized(false);
        }
        return list;
      });
      setPendingFeedback((prev) => {
        if (pending.length > prev.length && minimizedRef.current) {
          setMinimized(false);
        }
        return pending;
      });
      setPendingCancelSurveys((prev) => {
        if (cancelPending.length > prev.length && minimizedRef.current) {
          setMinimized(false);
        }
        return cancelPending;
      });
      for (const ex of list) {
        if (!toastedRef.current.has(ex.id)) {
          toastedRef.current.add(ex.id);
          toast.info(s.toastNew, {
            description: ex.skillTitle,
            duration: 8000,
          });
        }
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn("[SessionPreConfirmDock] pre-session-open failed", e);
      }
    }
  }, [token, s.toastNew]);

  useEffect(() => {
    void load();
  }, [load, user?.id]);

  useEffect(() => {
    if (!token) return;
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [token, load]);

  const myId = user?.id;
  const myEmail = user?.email;

  const onReportProblem = async (exchangeId: string) => {
    if (!token) return;
    const message = (problemText[exchangeId] ?? "").trim();
    if (!message) {
      toast.error(s.error, { description: s.reportProblemPlaceholder });
      return;
    }
    setReportingId(exchangeId);
    try {
      const updated = await reportSessionProblem(token, exchangeId, message);
      toast.success(s.toastPartialSettled, {
        description: `${updated.skillTitle} — ${updated.settledMinutes ?? 0} dk`,
        duration: 9000,
      });
      setProblemText((prev) => {
        const next = { ...prev };
        delete next[exchangeId];
        return next;
      });
      await load();
    } catch (e) {
      toast.error(s.error, { description: apiErrorDisplayMessage(e, "") });
    } finally {
      setReportingId(null);
    }
  };

  const onDecision = async (exchangeId: string, decision: "CONFIRM" | "DECLINE") => {
    if (!token) return;
    setSubmitting(exchangeId);
    try {
      const updated = await submitPreSessionResponse(token, exchangeId, decision);
      toastAfterPreSessionDecision(updated, decision, s);
      await load();
      if (updated.preSessionBothConfirmedAt || isCancelledStatus(updated.status)) {
        setMinimized(false);
      }
    } catch (e) {
      toast.error(s.error, { description: apiErrorDisplayMessage(e, "") });
    } finally {
      setSubmitting(null);
    }
  };

  const filtered = rows.filter((ex) => canResolveParticipant(ex, myId, myEmail));
  const visibleRows = filtered.length > 0 ? filtered : rows;

  const hasRealRows = visibleRows.length > 0;
  const hasFeedback = pendingFeedback.length > 0;
  const hasCancelSurvey = pendingCancelSurveys.length > 0;
  const panelOpen =
    Boolean(isAuthenticated && user) && (hasRealRows || hasFeedback || hasCancelSurvey);
  const itemCount = visibleRows.length + pendingFeedback.length + pendingCancelSurveys.length;

  // Dar ekranda yalnızca acil olmayan kartlar (değerlendirme / iptal anketi) varsa dock küçük sekme
  // olarak başlar; önceden mobilde paket kartını ve "Rezervasyon" butonunu kapatıyordu.
  // Zaman kritik seans onay kartı geldiğinde dock yeniden açılır.
  const onlyNonUrgent = !hasRealRows && (hasFeedback || hasCancelSurvey);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const narrow = window.matchMedia?.("(max-width: 640px)").matches ?? false;
    if (hasRealRows) {
      setMinimized(false);
    } else if (onlyNonUrgent && narrow) {
      setMinimized(true);
    }
  }, [hasRealRows, onlyNonUrgent]);

  const onSubmitFeedback = async (item: PendingReviewDockDto) => {
    if (!token) return;
    const rating = feedbackRating[item.exchangeRequestId] ?? 0;
    if (rating < 1) {
      toast.error(s.feedbackSelectStars);
      return;
    }
    setFeedbackSubmitting(item.exchangeRequestId);
    try {
      await createReview(token, item.exchangeRequestId, {
        rating,
        comment: (feedbackComment[item.exchangeRequestId] ?? "").trim() || undefined,
      });
      toast.success(s.feedbackThanks, {
        description: item.reviewedUserName,
        duration: 7000,
      });
      setFeedbackRating((prev) => {
        const next = { ...prev };
        delete next[item.exchangeRequestId];
        return next;
      });
      setFeedbackComment((prev) => {
        const next = { ...prev };
        delete next[item.exchangeRequestId];
        return next;
      });
      await load();
    } catch (e) {
      toast.error(s.error, { description: apiErrorDisplayMessage(e, "") });
    } finally {
      setFeedbackSubmitting(null);
    }
  };

  const feedbackSubtitle = (item: PendingReviewDockDto) => {
    const label = (item.outcomeLabel ?? "").toUpperCase();
    if (label === "PARTIAL") return s.feedbackSubtitlePartial;
    if (label === "CANCELLED") return s.feedbackSubtitleCancelled;
    return s.feedbackSubtitleCompleted;
  };

  const onSubmitCancelSurvey = async (item: PendingCancelSurveyDto) => {
    if (!token) return;
    const reason = cancelReason[item.exchangeRequestId];
    if (!reason) {
      toast.error(s.cancelSurveySelectReason);
      return;
    }
    setCancelSubmitting(item.exchangeRequestId);
    try {
      await submitCancelSurvey(token, item.exchangeRequestId, {
        reasonCode: reason,
        note: (cancelNote[item.exchangeRequestId] ?? "").trim() || undefined,
      });
      toast.success(s.cancelSurveyThanks);
      setCancelReason((prev) => {
        const next = { ...prev };
        delete next[item.exchangeRequestId];
        return next;
      });
      setCancelNote((prev) => {
        const next = { ...prev };
        delete next[item.exchangeRequestId];
        return next;
      });
      await load();
    } catch (e) {
      toast.error(s.error, { description: apiErrorDisplayMessage(e, "") });
    } finally {
      setCancelSubmitting(null);
    }
  };

  useEffect(() => {
    if (!panelOpen) {
      setMinimized(false);
    }
  }, [panelOpen]);

  if (!isAuthenticated || !user) return null;
  if (!panelOpen || !overlayEl) return null;

  const renderSessionCard = (ex: ExchangeRequestDto) => {
    const iAmRequester = iAmRequesterFor(ex, myId, myEmail);
    const myResp = iAmRequester ? ex.requesterPreSessionResponse : ex.ownerPreSessionResponse;
    const theirResp = iAmRequester ? ex.ownerPreSessionResponse : ex.requesterPreSessionResponse;
    const theirName = iAmRequester ? ex.ownerName : ex.requesterName;
    const myNorm = normResp(myResp);
    const theirNorm = normResp(theirResp);
    const phase = (ex.sessionDockPhase ?? "PRE_CONFIRM").toUpperCase();
    const needChoiceButtons = phase === "PRE_CONFIRM" && myNorm === "";
    const showWaitingStart = phase === "WAITING_START" && ex.scheduledStartAt;
    const showLive = phase === "LIVE" && ex.scheduledEndAt;
    const problemDraft = problemText[ex.id] ?? "";

    return (
      <article key={ex.id} className="tiempos-session-pre-dock-card">
        <div className="tiempos-session-pre-dock-card__head">
          <div className="tiempos-session-pre-dock-card__head-main">
            <h2 className="tiempos-session-pre-dock-card__title">{s.title}</h2>
            <p className="tiempos-session-pre-dock-card__subtitle">{s.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="tiempos-session-pre-dock-card__close"
            aria-label={s.closePanel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div>
          <p className="tiempos-session-pre-dock-card__skill">{ex.skillTitle}</p>
          <p className="tiempos-session-pre-dock-card__time">
            {formatSessionStart(ex.scheduledStartAt ?? null, locale)}
          </p>
        </div>
        <div className="tiempos-session-pre-dock-card__status">
          <p className="tiempos-session-pre-dock-card__status-title">{s.bothPartiesStatus}</p>
          <div className="tiempos-session-pre-dock-card__status-row">
            <span className="truncate">{ex.requesterName}</span>
            <span className="shrink-0 font-medium">
              {labelForResponse(ex.requesterPreSessionResponse, s)}
            </span>
          </div>
          <div className="tiempos-session-pre-dock-card__status-row">
            <span className="truncate">{ex.ownerName}</span>
            <span className="shrink-0 font-medium">{labelForResponse(ex.ownerPreSessionResponse, s)}</span>
          </div>
        </div>
        <div className="tiempos-session-pre-dock-card__status tiempos-session-pre-dock-card__status--highlight">
          <div className="tiempos-session-pre-dock-card__status-row">
            <span className="font-medium">{s.yourResponse}</span>
            <span className="shrink-0 font-semibold text-foreground">{youStatusLine(myNorm, s)}</span>
          </div>
          <div className="tiempos-session-pre-dock-card__status-row">
            <span className="truncate text-muted-foreground">
              {s.peerResponse}: {theirName}
            </span>
            <span className="shrink-0 font-semibold text-foreground">{peerStatusLine(theirNorm, s)}</span>
          </div>
        </div>
        {showWaitingStart ? (
          <SessionCountdown targetIso={ex.scheduledStartAt!} label={s.countdownToStart} />
        ) : null}
        {showLive ? (
          <>
            <SessionCountdown targetIso={ex.scheduledEndAt!} label={s.countdownToEnd} />
            <p className="tiempos-session-pre-dock-card__hint">{s.liveSessionHint}</p>
            <label className="tiempos-session-pre-dock-card__report-label">
              <span>{s.reportProblem}</span>
              <textarea
                className="tiempos-session-pre-dock-card__report-input"
                rows={3}
                value={problemDraft}
                placeholder={s.reportProblemPlaceholder}
                onChange={(e) =>
                  setProblemText((prev) => ({ ...prev, [ex.id]: e.target.value }))
                }
              />
            </label>
            <Button
              size="sm"
              variant="destructive"
              className="w-full"
              disabled={reportingId === ex.id}
              onClick={() => void onReportProblem(ex.id)}
            >
              {reportingId === ex.id ? s.reportProblemSubmitting : s.reportProblemSubmit}
            </Button>
          </>
        ) : null}
        {needChoiceButtons ? (
          <>
            {theirNorm === "DECLINED" ? (
              <p className="tiempos-session-pre-dock-card__hint">{s.peerDeclinedChoose}</p>
            ) : null}
            <div className="tiempos-session-pre-dock-card__actions">
              <Button
                size="sm"
                disabled={submitting === ex.id}
                onClick={() => void onDecision(ex.id, "CONFIRM")}
              >
                {submitting === ex.id ? s.submitting : s.confirm}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                disabled={submitting === ex.id}
                onClick={() => void onDecision(ex.id, "DECLINE")}
              >
                {s.decline}
              </Button>
            </div>
          </>
        ) : !showLive ? (
          <div className="space-y-2">
            {myNorm === "CONFIRMED" && theirNorm === "" ? (
              <p className="tiempos-session-pre-dock-card__hint">{s.waitingPeerAfterYouConfirmed}</p>
            ) : null}
            {myNorm === "DECLINED" && theirNorm === "" ? (
              <p className="tiempos-session-pre-dock-card__hint">{s.youDeclinedHint}</p>
            ) : null}
            <Button variant="secondary" size="sm" className="w-full" asChild>
              <Link to={PATHS.messages}>{s.openMessages}</Link>
            </Button>
          </div>
        ) : null}
      </article>
    );
  };

  const dock = (
    <div
      data-tiempos-session-pre-dock
      className={cn(
        "tiempos-session-pre-dock-root",
        minimized && "tiempos-session-pre-dock-root--minimized",
      )}
    >
      <button
        type="button"
        className="tiempos-session-pre-dock-tab"
        aria-label={s.expandDock}
        aria-expanded={!minimized}
        onClick={() => setMinimized(false)}
      >
        <ChevronLeft className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
        {itemCount > 1 ? (
          <span className="tiempos-session-pre-dock-tab__badge" aria-hidden>
            {itemCount}
          </span>
        ) : null}
        <span className="tiempos-session-pre-dock-tab__label">{s.minimizedTabLabel}</span>
      </button>

      <div className="tiempos-session-pre-dock-stack" role="region" aria-label={s.modalTitle}>
        {visibleRows.map(renderSessionCard)}

        {pendingCancelSurveys.map((item) => {
          const selected = cancelReason[item.exchangeRequestId] ?? "";
          const reasons: { code: CancelSurveyReasonCode; label: string }[] = [
            { code: "SCHEDULE", label: s.cancelReasonSchedule },
            { code: "NOT_NEEDED", label: s.cancelReasonNotNeeded },
            { code: "OTHER", label: s.cancelReasonOther },
          ];
          return (
            <article
              key={`cancel-survey-${item.exchangeRequestId}`}
              className="tiempos-session-pre-dock-card tiempos-session-pre-dock-card--cancel-survey"
            >
              <div className="tiempos-session-pre-dock-card__head">
                <div className="tiempos-session-pre-dock-card__head-main">
                  <h2 className="tiempos-session-pre-dock-card__title">{s.cancelSurveyTitle}</h2>
                  <p className="tiempos-session-pre-dock-card__subtitle">{s.cancelSurveySubtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMinimized(true)}
                  className="tiempos-session-pre-dock-card__close"
                  aria-label={s.closePanel}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="tiempos-session-pre-dock-card__skill">{item.skillTitle}</p>
              <div className="tiempos-session-pre-dock-card__reason-options" role="radiogroup">
                {reasons.map((r) => (
                  <label key={r.code} className="tiempos-session-pre-dock-card__reason-option">
                    <input
                      type="radio"
                      name={`cancel-reason-${item.exchangeRequestId}`}
                      value={r.code}
                      checked={selected === r.code}
                      onChange={() =>
                        setCancelReason((prev) => ({
                          ...prev,
                          [item.exchangeRequestId]: r.code,
                        }))
                      }
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
              {selected === "OTHER" ? (
                <label className="tiempos-session-pre-dock-card__report-label">
                  <span>{s.cancelSurveyNoteLabel}</span>
                  <textarea
                    className="tiempos-session-pre-dock-card__report-input"
                    rows={2}
                    maxLength={500}
                    value={cancelNote[item.exchangeRequestId] ?? ""}
                    onChange={(e) =>
                      setCancelNote((prev) => ({
                        ...prev,
                        [item.exchangeRequestId]: e.target.value,
                      }))
                    }
                  />
                </label>
              ) : null}
              <Button
                size="sm"
                className="w-full"
                variant="secondary"
                disabled={cancelSubmitting === item.exchangeRequestId || !selected}
                onClick={() => void onSubmitCancelSurvey(item)}
              >
                {cancelSubmitting === item.exchangeRequestId ? s.feedbackSubmitting : s.cancelSurveySubmit}
              </Button>
            </article>
          );
        })}

        {pendingFeedback.map((item) => {
          const rating = feedbackRating[item.exchangeRequestId] ?? 0;
          const comment = feedbackComment[item.exchangeRequestId] ?? "";
          const isQuick = (item.uiMode ?? "DETAIL").toUpperCase() === "QUICK";
          const commentOpen = feedbackCommentOpen[item.exchangeRequestId] ?? false;
          const settled =
            item.settledMinutes != null && item.settledMinutes > 0
              ? formatTemplate(s.feedbackSettledLine, {
                  minutes: String(item.settledMinutes),
                  booked: String(item.bookedMinutes),
                })
              : null;
          return (
            <article
              key={`feedback-${item.exchangeRequestId}`}
              className="tiempos-session-pre-dock-card tiempos-session-pre-dock-card--feedback"
            >
              <div className="tiempos-session-pre-dock-card__head">
                <div className="tiempos-session-pre-dock-card__head-main">
                  <h2 className="tiempos-session-pre-dock-card__title">
                    {isQuick ? s.howWasItTitle : s.feedbackTitle}
                  </h2>
                  <p className="tiempos-session-pre-dock-card__subtitle">
                    {isQuick ? s.howWasItSubtitle : feedbackSubtitle(item)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMinimized(true)}
                  className="tiempos-session-pre-dock-card__close"
                  aria-label={s.closePanel}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div>
                <p className="tiempos-session-pre-dock-card__skill">{item.skillTitle}</p>
                <p className="tiempos-session-pre-dock-card__time">
                  {item.reviewedUserName}
                  {settled ? ` · ${settled}` : null}
                </p>
                {!isQuick ? (
                  <Link
                    to={PATHS.user(item.reviewedUserId)}
                    className="tiempos-session-pre-dock-card__profile-link"
                  >
                    {s.feedbackViewProfile}
                  </Link>
                ) : null}
              </div>
              <div className={isQuick ? "tiempos-session-pre-dock-card__quick-rating" : undefined}>
                {!isQuick ? (
                  <p className="tiempos-session-pre-dock-card__status-title mb-1">{s.feedbackRateLabel}</p>
                ) : null}
                <StarRatingPicker
                  value={rating}
                  onChange={(n) =>
                    setFeedbackRating((prev) => ({ ...prev, [item.exchangeRequestId]: n }))
                  }
                  disabled={feedbackSubmitting === item.exchangeRequestId}
                  size={isQuick ? "lg" : "sm"}
                  ariaLabel={isQuick ? s.howWasItTitle : s.feedbackRateLabel}
                />
              </div>
              {isQuick ? (
                <>
                  {!commentOpen ? (
                    <button
                      type="button"
                      className="tiempos-session-pre-dock-card__optional-toggle"
                      onClick={() =>
                        setFeedbackCommentOpen((prev) => ({
                          ...prev,
                          [item.exchangeRequestId]: true,
                        }))
                      }
                    >
                      {s.addOptionalComment}
                    </button>
                  ) : (
                    <label className="tiempos-session-pre-dock-card__report-label">
                      <span>{s.feedbackCommentLabel}</span>
                      <textarea
                        className="tiempos-session-pre-dock-card__report-input"
                        rows={3}
                        maxLength={1000}
                        value={comment}
                        placeholder={s.feedbackCommentPlaceholder}
                        disabled={feedbackSubmitting === item.exchangeRequestId}
                        onChange={(e) =>
                          setFeedbackComment((prev) => ({
                            ...prev,
                            [item.exchangeRequestId]: e.target.value,
                          }))
                        }
                      />
                    </label>
                  )}
                  <div className="tiempos-session-pre-dock-card__actions">
                    {rating >= 1 && !commentOpen ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={feedbackSubmitting === item.exchangeRequestId}
                        onClick={() => void onSubmitFeedback(item)}
                      >
                        {s.skipOptionalComment}
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={feedbackSubmitting === item.exchangeRequestId || rating < 1}
                      onClick={() => void onSubmitFeedback(item)}
                    >
                      {feedbackSubmitting === item.exchangeRequestId
                        ? s.feedbackSubmitting
                        : s.feedbackSubmit}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <label className="tiempos-session-pre-dock-card__report-label">
                    <span>{s.feedbackCommentLabel}</span>
                    <textarea
                      className="tiempos-session-pre-dock-card__report-input"
                      rows={3}
                      maxLength={1000}
                      value={comment}
                      placeholder={s.feedbackCommentPlaceholder}
                      disabled={feedbackSubmitting === item.exchangeRequestId}
                      onChange={(e) =>
                        setFeedbackComment((prev) => ({
                          ...prev,
                          [item.exchangeRequestId]: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={feedbackSubmitting === item.exchangeRequestId || rating < 1}
                    onClick={() => void onSubmitFeedback(item)}
                  >
                    {feedbackSubmitting === item.exchangeRequestId
                      ? s.feedbackSubmitting
                      : s.feedbackSubmit}
                  </Button>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );

  return createPortal(dock, overlayEl);
}
