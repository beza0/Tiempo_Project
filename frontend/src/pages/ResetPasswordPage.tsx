import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import type { PageType } from "../App";
import { useLanguage } from "../contexts/LanguageContext";
import { AuthPageShell } from "../components/auth/AuthPageShell";
import { BrandLogo } from "../components/common/BrandLogo";
import { resetPasswordRequest } from "../api/auth";
import { apiErrorDisplayMessage } from "../api/client";

interface ResetPasswordPageProps {
  onNavigate?: (page: PageType) => void;
}

export function ResetPasswordPage({ onNavigate }: ResetPasswordPageProps) {
  const [email, setEmail] = useState(
    () => sessionStorage.getItem("tiempos_reset_email") ?? "",
  );
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  const a = t.auth.reset;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword || password.length < 8) return;
    setError(null);
    setLoading(true);
    try {
      await resetPasswordRequest({ email, token: code, newPassword: password });
      sessionStorage.removeItem("tiempos_reset_email");
      setPasswordReset(true);
    } catch (err) {
      setError(apiErrorDisplayMessage(err, a.pwdMismatch));
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password === confirmPassword;
  const passwordLengthValid = password.length >= 8;

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
          <h1 className="mb-1 text-2xl text-white min-[height:760px]:mb-2 min-[height:760px]:text-3xl">
            {passwordReset ? a.titleDone : a.title}
          </h1>
          <p className="text-sm text-white/80 min-[height:760px]:text-base">
            {passwordReset ? a.subtitleDone : a.subtitle}
          </p>
        </div>

        <div className="rounded-3xl bg-card p-5 text-card-foreground shadow-2xl sm:p-8">
          {!passwordReset ? (
            <>
              <form className="space-y-4 max-[height:700px]:space-y-3" onSubmit={(e) => void handleSubmit(e)}>
                <div>
                  <Label htmlFor="email">{t.auth.login.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t.contactPage.placeholderEmail}
                    className="mt-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="code">{t.auth.signup?.codeLabel ?? "Reset Code"}</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    className="mt-2 text-center tracking-widest text-lg"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">{a.newPassword}</Label>
                  <div className="relative mt-2">
                    <Input 
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {password && !passwordLengthValid && (
                    <p className="text-xs text-red-500 mt-1">
                      {a.pwdShort}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">{a.confirmNew}</Label>
                  <div className="relative mt-2">
                    <Input 
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-red-500 mt-1">
                      {a.pwdMismatch}
                    </p>
                  )}
                  {confirmPassword && passwordsMatch && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {a.pwdMatch}
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                    {error}
                  </p>
                )}

                <Button 
                  type="submit"
                  className="h-11 w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white sm:h-12"
                  disabled={!passwordsMatch || !passwordLengthValid || !email || code.length < 6 || loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {a.resetBtn}
                </Button>
              </form>

              <div className="mt-4 rounded-xl border border-border bg-muted/50 p-3 min-[height:760px]:mt-6 min-[height:760px]:p-4">
                <p className="mb-2 text-sm text-foreground/90">
                  {a.reqTitle}
                </p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className={`flex items-center gap-2 ${passwordLengthValid ? 'text-green-600' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${passwordLengthValid ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                    {a.reqLen}
                  </li>
                  <li className={`flex items-center gap-2 ${passwordsMatch && confirmPassword ? 'text-green-600' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${passwordsMatch && confirmPassword ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                    {a.reqMatch}
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <h3 className="mb-2 text-xl text-foreground">{a.allSet}</h3>
                <p className="mb-6 whitespace-pre-line text-muted-foreground">
                  {a.successBody}
                </p>

                <Button 
                  className="h-11 w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white sm:h-12"
                  onClick={() => onNavigate?.("login")}
                >
                  {a.continueSignIn}
                </Button>
              </div>
            </>
          )}
        </div>
    </AuthPageShell>
  );
}
