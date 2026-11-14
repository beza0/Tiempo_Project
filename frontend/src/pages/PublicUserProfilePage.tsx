import { PageLayout } from "../components/layout/PageLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { PageType } from "../App";
import {
  fetchPublicUserProfile,
  PUBLIC_PROFILE_USER_ID_KEY,
  type PublicUserProfileDto,
} from "../api/user";
import { apiErrorDisplayMessage } from "../api/client";
import { ImageWithFallback } from "../components/common/ImageWithFallback";
import { fetchPublicSkills, type SkillDto } from "../api/skills";
import { resolveSkillCoverImageUrl, skillCoverImageFallbackUrl } from "../lib/skillCoverImageUrl";
import {
  fallbackAvailabilityFromDescription,
  fallbackLocationFromDescription,
  fallbackSessionTypeFromDescription,
  getSkillAvailabilityParts,
  skillCardDescriptionPreview,
} from "../lib/skillProfileCardDisplay";
import {
  Star,
  MapPin,
  Calendar,
  BookOpen,
  ArrowLeft,
  Link2,
  Globe,
  MessageCircle,
  Share2,
} from "lucide-react";
import { initialsFromFullName } from "../lib/initials";
import { formatTemplate } from "../language";
import { PATHS } from "../navigation/paths";

type Props = { onNavigate?: (page: PageType) => void };

function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `https://${t}`;
}

export function PublicUserProfilePage({ onNavigate }: Props) {
  const navigate = useNavigate();
  const { userId: userIdParam } = useParams<{ userId: string }>();
  const { t, locale } = useLanguage();
  const pub = t.publicUserProfile;
  const p = t.profile;
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<PublicUserProfileDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skills, setSkills] = useState<SkillDto[]>([]);
  const [mainTab, setMainTab] = useState<"teaching" | "learning" | "reviews">(
    "teaching",
  );
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const dayLabels = t.addSkill.days;
  const catLabels = t.browse.categoryLabels;

  const load = useCallback(async () => {
    if (!token) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let id: string | null =
      userIdParam && userIdParam.trim() ? userIdParam.trim() : null;
    if (!id) {
      try {
        id = sessionStorage.getItem(PUBLIC_PROFILE_USER_ID_KEY);
      } catch {
        /* ignore */
      }
    }
    if (!id) {
      setError(pub.notFound);
      setProfile(null);
      setLoading(false);
      return;
    }
    if (user?.id && id.toLowerCase() === user.id.toLowerCase()) {
      onNavigate?.("profile");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPublicUserProfile(id, token);
      setProfile(data);
    } catch (e) {
      setError(apiErrorDisplayMessage(e, pub.loadError));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [token, user?.id, onNavigate, pub.loadError, pub.notFound, userIdParam]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!profile?.id) {
      setSkills([]);
      setSkillsLoading(false);
      return;
    }
    let cancelled = false;
    setSkillsLoading(true);
    fetchPublicSkills()
      .then((rows) => {
        if (cancelled) return;
        const mine = rows.filter(
          (s) => s.ownerId?.trim().toLowerCase() === profile.id.trim().toLowerCase(),
        );
        setSkills(mine);
      })
      .catch(() => {
        if (!cancelled) setSkills([]);
      })
      .finally(() => {
        if (!cancelled) setSkillsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  useEffect(() => {
    if (!shareFeedback) return;
    const id = window.setTimeout(() => setShareFeedback(null), 2500);
    return () => window.clearTimeout(id);
  }, [shareFeedback]);

  const handleShareProfile = useCallback(async () => {
    if (!profile?.id) {
      setShareFeedback(pub.loadError);
      return;
    }
    const shareUrl = `${window.location.origin}${PATHS.user(profile.id)}`;
    const shareTitle = profile.fullName || "Tiempos";
    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: p.shareProfile,
          url: shareUrl,
        });
        setShareFeedback(p.shareSuccess);
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback(p.shareCopied);
        return;
      }
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setShareFeedback(p.shareCopied);
    } catch {
      setShareFeedback(p.shareError);
    }
  }, [p, profile?.fullName, profile?.id, pub.loadError]);

  const displayName = profile?.fullName ?? "";
  const avatarSrc = profile?.avatarUrl?.trim() || null;

  const memberDateStr = profile?.memberSince
    ? new Date(profile.memberSince).toLocaleDateString(
        locale === "tr" ? "tr-TR" : "en-US",
        { year: "numeric", month: "long", day: "numeric" },
      )
    : null;

  const showRating =
    profile != null &&
    profile.totalReviews > 0 &&
    Number.isFinite(profile.averageRating);

  const openMessagesToUser = () => {
    if (!profile) return;
    try {
      sessionStorage.setItem("tiempos_open_user", profile.id);
    } catch {
      /* ignore */
    }
    onNavigate?.("messages");
  };

  const publicProfileHero =
    profile != null ? (
      <div className="flex flex-col items-start gap-6 md:flex-row">
        {avatarSrc ? (
          <ImageWithFallback
            src={avatarSrc}
            alt=""
            className="h-32 w-32 shrink-0 rounded-2xl border-4 border-white object-cover shadow-2xl"
          />
        ) : (
          <div
            className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-white/20 text-3xl font-semibold text-white shadow-2xl"
            aria-hidden
          >
            {initialsFromFullName(displayName)}
          </div>
        )}

        <div className="min-w-0 flex-1 text-white">
          <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <h1 className="mb-2 text-3xl">{displayName || "—"}</h1>
              <div className="mb-3 flex min-h-[28px] items-center gap-2">
                {showRating ? (
                  <>
                    <Star className="h-5 w-5 shrink-0 fill-yellow-300 text-yellow-300" />
                    <span className="text-lg">
                      {formatTemplate(p.reviewsCount, {
                        rating: profile.averageRating.toFixed(1),
                        count: String(profile.totalReviews),
                      })}
                    </span>
                  </>
                ) : (
                  <span className="text-lg text-white/80">{p.noRatingsYet}</span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                type="button"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={() => void handleShareProfile()}
                title={p.shareProfile}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                type="button"
                className="tp-btn-on-accent !py-1.5"
                onClick={() => openMessagesToUser()}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                {pub.sendMessage}
              </Button>
            </div>
          </div>

          {shareFeedback ? (
            <p className="mb-2 text-sm text-white/90">{shareFeedback}</p>
          ) : null}

          {profile.bio?.trim() ? (
            <p className="mb-4 max-w-2xl whitespace-pre-wrap text-white/90">
              {profile.bio}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-4 text-sm">
            {profile.location ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{profile.location}</span>
              </div>
            ) : null}
            {memberDateStr ? (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>
                  {formatTemplate(p.memberSince, { date: memberDateStr })}
                </span>
              </div>
            ) : null}
            {profile.languages?.trim() ? (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 shrink-0" />
                <span>{profile.languages}</span>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {profile.website?.trim() ? (
              <a
                className="inline-flex items-center gap-1 text-white/95 underline-offset-4 hover:underline"
                href={normalizeUrl(profile.website)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe className="h-4 w-4" />
                {profile.website}
              </a>
            ) : null}
            {profile.linkedin?.trim() ? (
              <a
                className="inline-flex items-center gap-1 text-white/95 underline-offset-4 hover:underline"
                href={normalizeUrl(profile.linkedin)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Link2 className="h-4 w-4" />
                LinkedIn
              </a>
            ) : null}
            {profile.twitter?.trim() ? (
              <a
                className="inline-flex items-center gap-1 text-white/95 underline-offset-4 hover:underline"
                href={normalizeUrl(profile.twitter)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Link2 className="h-4 w-4" />
                X / Twitter
              </a>
            ) : null}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <PageLayout onNavigate={onNavigate}>
      <div className="flex min-h-0 w-full flex-1 flex-col">
        {profile && !loading ? (
          <Tabs
            value={mainTab}
            onValueChange={(v) =>
              setMainTab(v as "teaching" | "learning" | "reviews")
            }
            className="flex min-h-0 w-full flex-1 flex-col gap-0"
          >
            <div className="shrink-0 bg-gradient-to-r from-blue-500 to-blue-700 px-4 pb-0 pt-24 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                <div className="mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => navigate(PATHS.browse)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {pub.backToBrowse}
                  </Button>
                </div>
                {publicProfileHero}
              </div>
              <div className="mx-auto max-w-5xl py-6">
                <TabsList className="rounded-xl border border-border bg-muted p-1 shadow-lg">
                  <TabsTrigger value="teaching" className="rounded-lg">
                    {p.tabTeaching}
                  </TabsTrigger>
                  <TabsTrigger value="learning" className="rounded-lg">
                    {p.tabLearning}
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="rounded-lg">
                    {p.tabReviews}
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col min-h-[min(26rem,42dvh)] px-4 pb-12 pt-0 sm:px-6 lg:px-8">
            <TabsContent value="teaching" className="flex min-h-0 flex-1 flex-col gap-4">
              <Card className="flex min-h-[min(22rem,38dvh)] flex-1 flex-col rounded-2xl border-0 p-6 shadow-lg">
                <div className="mb-6 flex shrink-0 items-center justify-between">
                  <h2 className="text-xl text-foreground">{p.skillsTeach}</h2>
                </div>

                {skillsLoading ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-16">
                    <p className="text-sm text-muted-foreground">
                      {t.common.loading}
                    </p>
                  </div>
                ) : skills.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-16">
                    <p className="text-center text-muted-foreground">
                      {pub.noSkills}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {skills.map((skill) => {
                      const levelKey = skill.level
                        ? (`${skill.level.charAt(0).toUpperCase()}${skill.level.slice(1).toLowerCase()}` as keyof typeof p.skillLevels)
                        : null;
                      const levelText =
                        levelKey && levelKey in p.skillLevels
                          ? p.skillLevels[levelKey]
                          : skill.level;
                      const categoryLabel =
                        skill.category &&
                        (catLabels[
                          skill.category as keyof typeof catLabels
                        ] ?? skill.category);
                      const preview = skillCardDescriptionPreview(skill.description);
                      const sessionTypeText =
                        skill.sessionTypes && skill.sessionTypes.length > 0
                          ? skill.sessionTypes
                              .map((v) =>
                                v === "in-person"
                                  ? t.addSkill.inPerson
                                  : t.addSkill.online,
                              )
                              .join(", ")
                          : fallbackSessionTypeFromDescription(skill.description);
                      const locationText =
                        (skill.inPersonLocation || "").trim() ||
                        fallbackLocationFromDescription(skill.description);
                      const availability =
                        getSkillAvailabilityParts(skill, dayLabels) ??
                        fallbackAvailabilityFromDescription(
                          skill.description,
                          dayLabels,
                        );
                      const coverUrl = resolveSkillCoverImageUrl(skill);

                      return (
                        <Card
                          key={skill.id}
                          className="overflow-hidden rounded-xl border border-border bg-muted/25 p-0"
                        >
                          <div className="relative h-40 w-full overflow-hidden sm:h-44">
                            {coverUrl ? (
                              <ImageWithFallback
                                src={coverUrl}
                                alt={skill.title}
                                fallbackSrc={skillCoverImageFallbackUrl(skill)}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div
                                className="h-full w-full bg-primary/20"
                                aria-hidden
                              />
                            )}
                          </div>
                          <div className="p-5">
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1 pr-2">
                                <h3 className="text-lg text-foreground">
                                  {skill.title}
                                </h3>
                                {categoryLabel ? (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {categoryLabel}
                                  </p>
                                ) : null}
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {levelText ? (
                                    <Badge variant="secondary">{levelText}</Badge>
                                  ) : null}
                                  {sessionTypeText ? (
                                    <Badge variant="outline">{sessionTypeText}</Badge>
                                  ) : null}
                                  {locationText ? (
                                    <Badge variant="outline">{locationText}</Badge>
                                  ) : null}
                                  {availability ? (
                                    <>
                                      <Badge
                                        variant="outline"
                                        className="h-auto max-w-full basis-full whitespace-normal text-left leading-snug sm:max-w-[min(100%,20rem)] sm:basis-auto"
                                      >
                                        {availability.days}
                                      </Badge>
                                      <Badge variant="outline" className="shrink-0">
                                        {availability.hours}
                                      </Badge>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm text-muted-foreground">
                                  {p.ratingPending}
                                </span>
                              </div>
                            </div>

                            {preview ? (
                              <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                                {preview}
                              </p>
                            ) : null}

                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              type="button"
                              onClick={() => navigate(PATHS.skill(skill.id))}
                            >
                              {pub.viewDetails}
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="learning" className="flex min-h-0 flex-1 flex-col gap-4">
              <Card className="flex min-h-[min(22rem,38dvh)] flex-1 flex-col rounded-2xl border-0 p-6 shadow-lg">
                <h2 className="mb-6 shrink-0 text-xl text-foreground">
                  {p.skillsLearning}
                </h2>
                <div className="flex flex-1 flex-col items-center justify-center py-16">
                  <p className="text-center text-muted-foreground">
                    {pub.learningPrivate}
                  </p>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="flex min-h-0 flex-1 flex-col gap-4">
              <Card className="flex min-h-[min(22rem,38dvh)] flex-1 flex-col rounded-2xl border-0 p-6 shadow-lg">
                <h2 className="mb-6 shrink-0 text-xl text-foreground">
                  {p.studentReviews}
                </h2>
                {profile.totalReviews > 0 ? (
                  <div className="flex flex-1 flex-col space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {formatTemplate(pub.reviewsSummary, {
                        rating: profile.averageRating.toFixed(1),
                        count: String(profile.totalReviews),
                      })}
                    </p>
                    <p className="flex flex-1 flex-col items-center justify-center py-6 text-center text-sm text-muted-foreground">
                      {pub.reviewsListPrivate}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center py-16">
                    <p className="text-center text-muted-foreground">
                      {p.emptyReviews}
                    </p>
                  </div>
                )}
              </Card>
            </TabsContent>
            </div>
          </Tabs>
        ) : (
          <>
            <div className="shrink-0 bg-gradient-to-r from-blue-500 to-blue-700 px-4 pb-32 pt-24 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                <div className="mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => navigate(PATHS.browse)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {pub.backToBrowse}
                  </Button>
                </div>
                {loading ? (
                  <p className="text-sm text-white/90">{t.common.loading}</p>
                ) : null}
                {error && !loading ? (
                  <p className="text-sm text-red-100">{error}</p>
                ) : null}
              </div>
            </div>
            <div className="mx-auto flex min-h-[min(26rem,42dvh)] w-full max-w-5xl flex-1 flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8" />
          </>
        )}
      </div>
    </PageLayout>
  );
}
