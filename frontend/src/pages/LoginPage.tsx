import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import type { PageType } from "../App";
import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { PATHS } from "../navigation/paths";
import { useLanguage } from "../contexts/LanguageContext";
import { loginRequest, resendVerificationEmail } from "../api/auth";
import { apiErrorDisplayMessage } from "../api/client";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
import { BrandLogo } from "../components/common/BrandLogo";

interface LoginPageProps {
  onNavigate?: (page: PageType) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const location = useLocation();
  const nav = useNavigate();
  const redirectAfterLogin = useMemo(() => {
    const st = location.state as
      | { from?: { pathname: string; search?: string } }
      | null
      | undefined;
    const f = st?.from;
    if (f?.pathname) {
      return `${f.pathname}${f.search ?? ""}`;
    }
    return PATHS.dashboard;
  }, [location.state]);

  const { login } = useAuth();
  const { t } = useLanguage();
  const a = t.auth.login;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendHint, setResendHint] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    if (!email || !password) {
      setError(a.errorRequired);
      return;
    }
    setLoading(true);
    setResendHint(null);
    try {
      const res = await loginRequest({ email, password });
      login(
        {
          id: res.userId,
          name: res.fullName,
          email: res.email,
          role: res.role,
        },
        res.token,
        rememberMe,
      );
      nav(redirectAfterLogin, { replace: true });
    } catch (err) {
      setError(apiErrorDisplayMessage(err, a.errorFailed));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError(null);
    setResendHint(null);
    const form = document.getElementById("login-form") as HTMLFormElement | null;
    const emailInput = form?.querySelector<HTMLInputElement>('input[name="email"]');
    const email = emailInput?.value?.trim() ?? "";
    if (!email) {
      setError(a.errorRequired);
      return;
    }
    setResendLoading(true);
    try {
      await resendVerificationEmail(email);
      setResendHint(a.verificationResentHint);
    } catch (err) {
      setError(apiErrorDisplayMessage(err, a.errorFailed));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button 
            onClick={() => onNavigate?.("landing")}
            className="inline-flex items-center gap-2 mb-4"
          >
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
              <BrandLogo className="h-full w-full object-cover" />
            </div>
            <span className="text-2xl text-white">Tiempo</span>
          </button>
          <h1 className="text-3xl text-white mb-2">{a.welcome}</h1>
          <p className="text-white/80">{a.subtitle}</p>
        </div>

        <div className="rounded-3xl bg-card p-8 text-card-foreground shadow-2xl">
          {error ? (
            <p
              className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {resendHint ? (
            <p
              className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-800 dark:text-green-200"
              role="status"
            >
              {resendHint}
            </p>
          ) : null}
          <form id="login-form" className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">{a.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                className="mt-2"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{a.password}</Label>
                <button
                  type="button"
                  onClick={() => onNavigate?.("forgot-password")}
                  className="text-sm text-primary hover:underline"
                >
                  {a.forgot}
                </button>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="mt-2"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
              />
              <label htmlFor="remember" className="cursor-pointer text-sm text-muted-foreground">
                {a.remember}
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-6"
            >
              {loading ? t.common.loading : a.signIn}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm text-muted-foreground"
              disabled={resendLoading}
              onClick={() => void handleResendVerification()}
            >
              {resendLoading ? t.common.loading : a.resendVerification}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              {a.noAccount}{" "}
              <button 
                onClick={() => onNavigate?.("signup")}
                className="text-primary hover:underline"
              >
                {a.signUp}
              </button>
            </p>
            <p className="text-sm text-muted-foreground">
              {a.orContinue}{" "}
              <button 
                onClick={() => onNavigate?.("how-it-works")}
                className="text-primary hover:underline"
              >
                {a.continueGuest}
              </button>
            </p>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-2 text-muted-foreground">{a.orWith}</span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleSignInButton
                disabled={loading}
                onError={(msg) => {
                  setError(msg);
                  setResendHint(null);
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
                    rememberMe,
                  );
                  nav(redirectAfterLogin, { replace: true });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
