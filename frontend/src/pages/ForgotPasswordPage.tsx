import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ArrowLeft, Mail, CheckCircle, Loader2 } from "lucide-react";
import type { PageType } from "../App";
import { useLanguage } from "../contexts/LanguageContext";
import { AuthPageShell } from "../components/auth/AuthPageShell";
import { BrandLogo } from "../components/common/BrandLogo";
import { forgotPasswordRequest } from "../api/auth";

interface ForgotPasswordPageProps {
  onNavigate?: (page: PageType) => void;
}

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const a = t.auth.forgot;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPasswordRequest(email);
      setEmailSent(true);
    } catch {
      setEmailSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await forgotPasswordRequest(email);
    } catch {
      // silent — don't reveal whether the email exists
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
          <h1 className="mb-1 text-2xl text-white min-[height:760px]:mb-2 min-[height:760px]:text-3xl">
            {emailSent ? a.titleSent : a.title}
          </h1>
          <p className="text-sm text-white/80 min-[height:760px]:text-base">
            {emailSent ? a.subtitleSent : a.subtitle}
          </p>
        </div>

        <div className="rounded-3xl bg-card p-5 text-card-foreground shadow-2xl sm:p-8">
          {!emailSent ? (
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

                <Button 
                  type="submit"
                  className="h-11 w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white sm:h-12"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {a.sendLink}
                </Button>
              </form>

              <div className="mt-4 text-center min-[height:760px]:mt-6">
                <button 
                  onClick={() => onNavigate?.("login")}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {a.backSignIn}
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-900/50 dark:bg-blue-950/40 min-[height:760px]:mt-6 min-[height:760px]:p-4">
                <p className="text-sm text-foreground/90">
                  <strong>{t.common.note}:</strong> {a.noteBox}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <h3 className="mb-2 text-xl text-foreground">{a.emailSent}</h3>
                <p className="mb-6 text-muted-foreground">
                  {a.sentToPrefix}<br />
                  <strong>{email}</strong>
                </p>

                <div className="space-y-3">
                  <Button 
                    className="h-11 w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white sm:h-12"
                    onClick={() => {
                      sessionStorage.setItem("tiempos_reset_email", email);
                      onNavigate?.("reset-password");
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {a.openDemo}
                  </Button>

                  <Button 
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                    onClick={() => void handleResend()}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {a.resend}
                  </Button>
                </div>
              </div>

              <div className="mt-4 text-center min-[height:760px]:mt-6">
                <button 
                  onClick={() => onNavigate?.("login")}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {a.backSignIn}
                </button>
              </div>
            </>
          )}
        </div>
    </AuthPageShell>
  );
}
