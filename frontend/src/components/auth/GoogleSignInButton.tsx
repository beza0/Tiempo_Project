import { Button } from "../ui/button";
import { socialLoginRequest } from "../../api/auth";
import { apiErrorDisplayMessage } from "../../api/client";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  beginGoogleAccessTokenLogin,
  mountGoogleSignInButton,
  resolveGoogleClientId,
} from "../../lib/socialAuth";
import { useCallback, useEffect, useRef, useState } from "react";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onSuccess: (result: {
    userId: string;
    fullName: string;
    email: string;
    role: string;
    token: string;
  }) => void;
  onError: (message: string) => void;
};

export function GoogleSignInButton({
  disabled,
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const { t, locale } = useLanguage();
  const a = t.auth.login;
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [useFallbackButton, setUseFallbackButton] = useState(true);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const completeSocialLogin = useCallback(
    async (opts: { idToken?: string; accessToken?: string }) => {
      onError("");
      setLoading(true);
      try {
        const res = await socialLoginRequest({
          provider: "google",
          idToken: opts.idToken,
          accessToken: opts.accessToken,
        });
        onSuccess({
          userId: res.userId,
          fullName: res.fullName,
          email: res.email,
          role: res.role,
          token: res.token,
        });
      } catch (err) {
        if (err instanceof Error && err.message === "GOOGLE_CANCELLED") {
          return;
        }
        onError(apiErrorDisplayMessage(err, a.errorGoogleFailed));
      } finally {
        setLoading(false);
      }
    },
    [a.errorGoogleFailed, onError, onSuccess],
  );

  useEffect(() => {
    let cancelled = false;
    setBootstrapping(true);
    void resolveGoogleClientId().then((id) => {
      if (cancelled) return;
      setClientId(id);
      setUseFallbackButton(!id);
      setBootstrapping(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (bootstrapping || !clientId || !containerRef.current) {
      return;
    }
    let cancelled = false;
    const el = containerRef.current;
    setUseFallbackButton(false);

    void mountGoogleSignInButton(el, {
      locale,
      onCredential: (credential) => {
        if (!disabledRef.current && !cancelled) {
          void completeSocialLogin({ idToken: credential });
        }
      },
    }).catch(() => {
      if (!cancelled) {
        setUseFallbackButton(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [bootstrapping, clientId, locale, completeSocialLogin]);

  const handleFallbackClick = async () => {
    const id = clientId ?? (await resolveGoogleClientId());
    if (!id) {
      onError(a.errorGoogleNotConfigured);
      return;
    }
    setLoading(true);
    try {
      const accessToken = await beginGoogleAccessTokenLogin();
      await completeSocialLogin({ accessToken });
    } catch (err) {
      if (err instanceof Error && err.message === "GOOGLE_CANCELLED") {
        return;
      }
      onError(apiErrorDisplayMessage(err, a.errorGoogleFailed));
    } finally {
      setLoading(false);
    }
  };

  if (bootstrapping) {
    return (
      <Button variant="outline" className="w-full" type="button" disabled>
        <GoogleIcon />
        <span className="ml-2">{t.common.loading}</span>
      </Button>
    );
  }

  if (useFallbackButton) {
    return (
      <Button
        variant="outline"
        className="w-full"
        type="button"
        disabled={disabled || loading}
        onClick={() => void handleFallbackClick()}
      >
        <GoogleIcon />
        <span className="ml-2">
          {loading ? t.common.loading : a.googleSignIn}
        </span>
      </Button>
    );
  }

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className={`flex min-h-[44px] w-full justify-center ${disabled || loading ? "pointer-events-none opacity-50" : ""}`}
        aria-busy={loading}
      />
      {loading ? (
        <p className="mt-2 text-center text-sm text-muted-foreground">{t.common.loading}</p>
      ) : null}
    </div>
  );
}
