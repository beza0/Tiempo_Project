import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import type { PageType } from "../App";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { PATHS } from "../navigation/paths";
import { resolvePostAuthRedirect } from "../navigation/postAuthRedirect";
import { useLanguage } from "../contexts/LanguageContext";
import { loginRequest } from "../api/auth";
import { apiErrorDisplayMessage } from "../api/client";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
import { AuthPageShell } from "../components/auth/AuthPageShell";
import { BrandLogo } from "../components/common/BrandLogo";

interface LoginPageProps {
  onNavigate?: (page: PageType) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const location = useLocation();
  const nav = useNavigate();
  const redirectAfterLogin = resolvePostAuthRedirect(location.state, PATHS.dashboard);

  const { login } = useAuth();
  const { t } = useLanguage();
  const a = t.auth.login;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
          <h1 className="mb-1 text-2xl text-white min-[height:760px]:mb-2 min-[height:760px]:text-3xl">{a.welcome}</h1>
          <p className="text-sm text-white/80 min-[height:760px]:text-base">{a.subtitle}</p>
        </div>

        <div className="rounded-3xl bg-card p-5 text-card-foreground shadow-2xl sm:p-8">
          {error ? (
            <p
              className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <form className="space-y-4 max-[height:700px]:space-y-3" onSubmit={handleSubmit}>
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
              className="h-11 w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white sm:h-12"
            >
              {loading ? t.common.loading : a.signIn}
            </Button>
          </form>

          <div className="mt-4 space-y-2 text-center min-[height:760px]:mt-6 min-[height:760px]:space-y-3">
            <p className="text-sm text-muted-foreground">
              {a.noAccount}{" "}
              <button 
                onClick={() =>
                  nav(PATHS.signup, {
                    replace: false,
                    state: location.state,
                  })
                }
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
                  setError(msg);
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
    </AuthPageShell>
  );
}
