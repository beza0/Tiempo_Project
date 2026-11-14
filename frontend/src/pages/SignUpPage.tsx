import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { useEffect, useState } from "react";
import type { PageType } from "../App";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PATHS } from "../navigation/paths";
import { resolvePostAuthRedirect } from "../navigation/postAuthRedirect";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import {
  loginRequest,
  registerRequest,
  resendVerificationEmail,
  verifyEmailWithCode,
} from "../api/auth";
import { apiErrorDisplayMessage } from "../api/client";
import { formatTemplate } from "../language";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
import { AuthPageShell } from "../components/auth/AuthPageShell";
import { BrandLogo } from "../components/common/BrandLogo";

const RESEND_COOLDOWN_SEC = 60;

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface SignUpPageProps {
  onNavigate?: (page: PageType) => void;
}

export function SignUpPage({ onNavigate }: SignUpPageProps) {
  const { login } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  /** Doğrudan /buy-credits vb. açılıp kayıt olunmuşsa buraya dönülür; yoksa profil onboarding */
  const redirectAfterAuth = resolvePostAuthRedirect(location.state, PATHS.editProfile);
  const { t } = useLanguage();
  const a = t.auth.signup;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [smtpMailDeliveryEnabled, setSmtpMailDeliveryEnabled] = useState(false);
  const [smtpLocalCapture, setSmtpLocalCapture] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [localDevCode, setLocalDevCode] = useState<string | null>(null);
  useEffect(() => {
    if (!awaitingVerification || resendCooldown <= 0) return;
    const id = window.setInterval(() => {
      setResendCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [awaitingVerification, resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const fullName = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirm-password") || "");

    if (password !== confirm) {
      setError(a.errorPasswordMismatch);
      return;
    }

    if (!acceptedTerms) {
      setError(a.errorTermsRequired);
      return;
    }

    setLoading(true);
    try {
      const created = await registerRequest({
        fullName,
        email,
        password,
        acceptedTerms: true,
      });
      if (!created?.id) {
        throw new Error(a.errorFailed);
      }
      if (created.emailVerificationPending) {
        setPendingEmail(email.trim().toLowerCase());
        setSmtpMailDeliveryEnabled(Boolean(created.smtpMailDeliveryEnabled));
        setSmtpLocalCapture(
          created.smtpLocalCapture !== undefined ? Boolean(created.smtpLocalCapture) : true,
        );
        setResendCooldown(RESEND_COOLDOWN_SEC);
        setAwaitingVerification(true);
        const vc = created.verificationCode?.trim();
        setLocalDevCode(vc && vc.length > 0 ? vc : null);
        return;
      }
      const res = await loginRequest({ email, password });
      login(
        {
          id: res.userId,
          name: res.fullName,
          email: res.email,
          role: res.role,
        },
        res.token,
      );
      if (redirectAfterAuth === PATHS.editProfile) {
        sessionStorage.setItem("tiempos_profile_onboarding", "1");
      }
      nav(redirectAfterAuth, { replace: true });
    } catch (err) {
      setError(apiErrorDisplayMessage(err, a.errorFailed));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!pendingEmail) return;
    const code = verifyCode.replace(/\D/g, "").slice(0, 6);
    if (code.length !== 6) {
      setError(a.errorVerifyCodeShort);
      return;
    }
    setError(null);
    setVerifyLoading(true);
    try {
      const res = await verifyEmailWithCode({ email: pendingEmail, code });
      login(
        {
          id: res.userId,
          name: res.fullName,
          email: res.email,
          role: res.role,
        },
        res.token,
      );
      if (redirectAfterAuth === PATHS.editProfile) {
        sessionStorage.setItem("tiempos_profile_onboarding", "1");
      }
      nav(redirectAfterAuth, { replace: true });
    } catch (err) {
      setError(apiErrorDisplayMessage(err, a.errorFailed));
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!pendingEmail) return;
    setError(null);
    setResendLoading(true);
    try {
      const r = await resendVerificationEmail(pendingEmail);
      setResendCooldown(RESEND_COOLDOWN_SEC);
      const vc = r.verificationCode?.trim();
      setLocalDevCode(vc && vc.length > 0 ? vc : null);
    } catch (err) {
      setError(apiErrorDisplayMessage(err, a.errorFailed));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthPageShell>
        <div className="mb-4 text-center min-[height:760px]:mb-8">
          <button 
            onClick={() => onNavigate?.("landing")}
            className="mb-3 inline-flex items-center gap-2 min-[height:760px]:mb-4"
          >
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm min-[height:760px]:h-14 min-[height:760px]:w-14">
              <BrandLogo className="h-full w-full object-cover" />
            </div>
            <span className="text-xl text-white min-[height:760px]:text-2xl">Tiempos</span>
          </button>
          <h1 className="mb-1 text-2xl text-white min-[height:760px]:mb-2 min-[height:760px]:text-3xl">{a.title}</h1>
          <p className="text-sm text-white/80 min-[height:760px]:text-base">{a.subtitle}</p>
        </div>

        <div className="rounded-3xl bg-card p-5 text-card-foreground shadow-2xl sm:p-8">
          {awaitingVerification ? (
            <div className="space-y-4 max-[height:700px]:space-y-3">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">{a.verifySentTitle}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{a.verifySentBody}</p>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {!smtpMailDeliveryEnabled
                    ? a.verifyLogsHint
                    : smtpLocalCapture
                      ? a.verifyMailHint
                      : a.verifyRealInboxHint}
                </p>
                {pendingEmail ? (
                  <p className="mt-2 text-sm font-medium text-foreground">{pendingEmail}</p>
                ) : null}
                {localDevCode ? (
                  <p
                    className="mt-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-center font-mono text-lg font-semibold tracking-wider text-foreground"
                    translate="no"
                  >
                    {localDevCode}
                  </p>
                ) : null}
              </div>
              {error ? (
                <p
                  className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
              <div>
                <Label htmlFor="verify-code">{a.codeLabel}</Label>
                <Input
                  id="verify-code"
                  value={verifyCode}
                  onChange={(e) =>
                    setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder={a.codePlaceholder}
                  className="mt-2 text-center font-mono text-lg tracking-[0.35em]"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  aria-invalid={verifyCode.length > 0 && verifyCode.length < 6}
                />
              </div>
              <Button
                type="button"
                disabled={verifyLoading || verifyCode.replace(/\D/g, "").length !== 6}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white"
                onClick={() => void handleVerifyCode()}
              >
                {verifyLoading ? t.common.loading : a.verifyAccountBtn}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={resendLoading || resendCooldown > 0}
                onClick={() => void handleResendCode()}
              >
                {resendLoading
                  ? t.common.loading
                  : resendCooldown > 0
                    ? formatTemplate(a.resendCodeWithTimer, {
                        time: formatMmSs(resendCooldown),
                      })
                    : a.resendCodeBtn}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  onClick={() =>
                    nav(PATHS.login, { replace: false, state: location.state })
                  }
                >
                  {a.goToSignIn}
                </button>
              </div>
            </div>
          ) : null}
          {!awaitingVerification && error ? (
            <p
              className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {!awaitingVerification ? (
          <>
          <form className="space-y-4 max-[height:700px]:space-y-3" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name">{a.fullName}</Label>
              <Input
                id="name"
                name="name"
                placeholder={t.contactPage.placeholderName}
                className="mt-2"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <Label htmlFor="email">{a.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t.contactPage.placeholderEmail}
                className="mt-2"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <Label htmlFor="password">{a.password}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="mt-2"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="confirm-password">{a.confirmPassword}</Label>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                placeholder="••••••••"
                className="mt-2"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                className="mt-1"
                checked={acceptedTerms}
                onCheckedChange={(checked) => {
                  const v = Boolean(checked);
                  setAcceptedTerms(v);
                  if (v) setError((prev) => (prev === a.errorTermsRequired ? null : prev));
                }}
              />
              <label htmlFor="terms" className="cursor-pointer text-sm text-muted-foreground">
                {a.termsPrefix}{" "}
                <Link to={PATHS.terms} className="text-primary hover:underline">
                  {a.terms}
                </Link>
                {" "}{a.and}{" "}
                <Link to={PATHS.privacy} className="text-primary hover:underline">
                  {a.privacy}
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white sm:h-12"
            >
              {loading ? t.common.loading : a.createAccount}
            </Button>
          </form>

          <div className="mt-4 text-center min-[height:760px]:mt-6">
            <p className="text-sm text-muted-foreground">
              {a.hasAccount}{" "}
              <button 
                onClick={() =>
                  nav(PATHS.login, { replace: false, state: location.state })
                }
                className="text-primary hover:underline"
              >
                {a.signIn}
              </button>
            </p>
          </div>

          <div className="mt-4 min-[height:760px]:mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-2 text-muted-foreground">{a.orWith}</span>
              </div>
            </div>

            <div className="mt-4 min-[height:760px]:mt-6">
              <GoogleSignInButton
                disabled={loading}
                onError={(msg) => {
                  if (msg) setError(msg);
                }}
                onSuccess={(res) => {
                  login(
                    {
                      id: res.userId,
                      name: res.fullName,
                      email: res.email,
                      role: res.role,
                    },
                    res.token,
                  );
                  if (redirectAfterAuth === PATHS.editProfile) {
                    sessionStorage.setItem("tiempos_profile_onboarding", "1");
                  }
                  nav(redirectAfterAuth, { replace: true });
                }}
              />
            </div>
          </div>
          </>
          ) : null}
        </div>
    </AuthPageShell>
  );
}
