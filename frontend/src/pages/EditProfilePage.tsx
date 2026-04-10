import { PageLayout } from "../components/layout/PageLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { ImageWithFallback } from "../components/common/ImageWithFallback";
import { Camera } from "lucide-react";
import type { PageType } from "../App";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useCallback, useEffect, useState } from "react";
import { fetchMyProfile, updateMyProfile } from "../api/user";
import { ApiError } from "../api/client";

const ONBOARDING_KEY = "timelink_profile_onboarding";

interface EditProfilePageProps {
  onNavigate?: (page: PageType) => void;
}

const PLACEHOLDER_AVATAR =
  "https://images.unsplash.com/photo-1719257751404-1dea075324bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

export function EditProfilePage({ onNavigate }: EditProfilePageProps) {
  const { t } = useLanguage();
  const e = t.editProfile;
  const { token, patchUser } = useAuth();

  const [onboarding, setOnboarding] = useState(
    () =>
      typeof window !== "undefined" &&
      sessionStorage.getItem(ONBOARDING_KEY) === "1",
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [languages, setLanguages] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const p = await fetchMyProfile(token);
      setFullName(p.fullName ?? "");
      setEmail(p.email ?? "");
      setBio(p.bio ?? "");
      setLocation(p.location ?? "");
      setPhone(p.phone ?? "");
      setLanguages(p.languages ?? "");
      setWebsite(p.website ?? "");
      setLinkedin(p.linkedin ?? "");
      setTwitter(p.twitter ?? "");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : e.errorLoadFailed;
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [token, e.errorLoadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  const finishOnboarding = () => {
    sessionStorage.removeItem(ONBOARDING_KEY);
    setOnboarding(false);
  };

  const handleSkip = () => {
    finishOnboarding();
    onNavigate?.("dashboard");
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!token) return;
    setSaveError(null);
    setSaving(true);
    try {
      const saved = await updateMyProfile(token, {
        fullName: fullName.trim(),
        bio: bio.trim() || null,
        phone: phone.trim() || null,
        location: location.trim() || null,
        languages: languages.trim() || null,
        website: website.trim() || null,
        linkedin: linkedin.trim() || null,
        twitter: twitter.trim() || null,
      });
      patchUser({
        id: saved.id,
        name: saved.fullName,
        email: saved.email,
      });
      if (onboarding) {
        finishOnboarding();
      }
      onNavigate?.("dashboard");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : e.errorSaveFailed;
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout onNavigate={onNavigate}>
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl text-foreground">{e.title}</h1>
            <p className="text-muted-foreground">
              {onboarding ? e.onboardingSubtitle : e.subtitle}
            </p>
          </div>

          {onboarding ? (
            <div
              className="mb-6 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground"
              role="status"
            >
              {e.onboardingHint}
            </div>
          ) : null}

          {loadError ? (
            <p
              className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {loadError}
            </p>
          ) : null}

          <Card className="rounded-2xl border-0 p-8 shadow-lg">
            {loading ? (
              <p className="text-muted-foreground">{t.common.loading}</p>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                {saveError ? (
                  <p
                    className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    role="alert"
                  >
                    {saveError}
                  </p>
                ) : null}

                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                    <ImageWithFallback
                      src={PLACEHOLDER_AVATAR}
                      alt=""
                      className="w-32 h-32 rounded-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                      aria-label={e.photoHint}
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {e.photoHint}
                  </p>
                </div>

                <div>
                  <Label htmlFor="name">{e.fullName}</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(ev) => setFullName(ev.target.value)}
                    className="mt-2"
                    required
                    autoComplete="name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">{e.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    readOnly
                    disabled
                    className="mt-2 opacity-80"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">{e.bio}</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(ev) => setBio(ev.target.value)}
                    className="mt-2 min-h-24"
                    placeholder={e.bioPh}
                  />
                </div>

                <div>
                  <Label htmlFor="location">{e.location}</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(ev) => setLocation(ev.target.value)}
                    placeholder={e.locationPh}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">{e.phone}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(ev) => setPhone(ev.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="languages">{e.languages}</Label>
                  <Input
                    id="languages"
                    value={languages}
                    onChange={(ev) => setLanguages(ev.target.value)}
                    placeholder={e.languagesPh}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="website">{e.website}</Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(ev) => setWebsite(ev.target.value)}
                    placeholder={e.websitePh}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkedin">{e.linkedin}</Label>
                    <Input
                      id="linkedin"
                      value={linkedin}
                      onChange={(ev) => setLinkedin(ev.target.value)}
                      placeholder={e.linkedinPh}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter">{e.twitter}</Label>
                    <Input
                      id="twitter"
                      value={twitter}
                      onChange={(ev) => setTwitter(ev.target.value)}
                      placeholder={e.twitterPh}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:gap-4">
                  {onboarding ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={handleSkip}
                      disabled={saving}
                    >
                      {e.skipLater}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => onNavigate?.("profile")}
                      disabled={saving}
                    >
                      {t.common.cancel}
                    </Button>
                  )}
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    disabled={saving}
                  >
                    {saving ? t.common.loading : t.common.saveChanges}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
