import { fetchGoogleAuthConfig } from "../api/auth";

type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            itp_support?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              width?: number | string;
              locale?: string;
              shape?: string;
              logo_alignment?: string;
            },
          ) => void;
        };
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            prompt?: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => { requestAccessToken: (overrideConfig?: { prompt?: string }) => void };
        };
      };
    };
  }
}

let gsiScriptPromise: Promise<void> | null = null;
let gsiInitializedClientId: string | null = null;
let gsiCredentialHandler: ((credential: string) => void) | null = null;

/** Build-time veya runtime (API) client id önbelleği. */
let resolvedClientId: string | null | undefined;
let resolveClientIdPromise: Promise<string | null> | null = null;

function readClientIdFromEnv(): string | null {
  const clientId =
    (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ??
    (import.meta.env.GOOGLE_CLIENT_ID as string | undefined);
  const trimmed = clientId?.trim();
  return trimmed ? trimmed : null;
}

function loadScriptOnce(id: string, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Script load failed")), {
        once: true,
      });
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      s.dataset.loaded = "true";
      resolve();
    };
    s.onerror = () => reject(new Error("Script load failed"));
    document.head.appendChild(s);
  });
}

/** Vite .env veya backend /api/auth/google-config üzerinden client id. */
export async function resolveGoogleClientId(): Promise<string | null> {
  if (resolvedClientId !== undefined) {
    return resolvedClientId;
  }
  if (!resolveClientIdPromise) {
    resolveClientIdPromise = (async () => {
      const fromEnv = readClientIdFromEnv();
      if (fromEnv) {
        return fromEnv;
      }
      try {
        const cfg = await fetchGoogleAuthConfig();
        const id = cfg.clientId?.trim();
        return id ? id : null;
      } catch {
        return null;
      }
    })();
  }
  resolvedClientId = await resolveClientIdPromise;
  return resolvedClientId;
}

export function getGoogleClientId(): string | null {
  if (resolvedClientId !== undefined) {
    return resolvedClientId;
  }
  return readClientIdFromEnv();
}

export function isGoogleLoginConfigured(): boolean {
  return Boolean(getGoogleClientId());
}

export async function isGoogleLoginConfiguredAsync(): Promise<boolean> {
  return Boolean(await resolveGoogleClientId());
}

function loadGoogleGsi(): Promise<void> {
  if (!gsiScriptPromise) {
    gsiScriptPromise = loadScriptOnce(
      "google-gsi-sdk",
      "https://accounts.google.com/gsi/client",
    );
  }
  return gsiScriptPromise;
}

function ensureGsiInitialized(clientId: string): void {
  const idApi = window.google?.accounts?.id;
  if (!idApi) {
    throw new Error("Google sign-in is unavailable");
  }
  if (gsiInitializedClientId === clientId) {
    return;
  }
  idApi.initialize({
    client_id: clientId,
    callback: (response) => {
      const credential = response.credential?.trim();
      if (credential && gsiCredentialHandler) {
        gsiCredentialHandler(credential);
      }
    },
    auto_select: false,
    cancel_on_tap_outside: true,
    itp_support: true,
  });
  gsiInitializedClientId = clientId;
}

export async function mountGoogleSignInButton(
  container: HTMLElement,
  options: {
    locale: string;
    onCredential: (idToken: string) => void;
  },
): Promise<void> {
  const clientId = await resolveGoogleClientId();
  if (!clientId) {
    throw new Error("GOOGLE_NOT_CONFIGURED");
  }
  await loadGoogleGsi();
  gsiCredentialHandler = options.onCredential;
  ensureGsiInitialized(clientId);

  const idApi = window.google?.accounts?.id;
  if (!idApi?.renderButton) {
    throw new Error("Google sign-in is unavailable");
  }

  container.replaceChildren();
  const width = Math.max(280, Math.floor(container.getBoundingClientRect().width) || 320);
  idApi.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "signin_with",
    shape: "rectangular",
    logo_alignment: "left",
    width,
    locale: options.locale === "tr" ? "tr" : "en",
  });
}

export async function beginGoogleAccessTokenLogin(): Promise<string> {
  const clientId = await resolveGoogleClientId();
  if (!clientId) {
    throw new Error("GOOGLE_NOT_CONFIGURED");
  }
  await loadGoogleGsi();
  const initTokenClient = window.google?.accounts?.oauth2?.initTokenClient;
  if (!initTokenClient) {
    throw new Error("Google sign-in is unavailable");
  }
  return new Promise((resolve, reject) => {
    const client = initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      prompt: "",
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(
            new Error(
              response.error === "access_denied"
                ? "GOOGLE_CANCELLED"
                : response.error_description || "Google login failed",
            ),
          );
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(
          new Error(
            error.type === "popup_closed"
              ? "GOOGLE_CANCELLED"
              : error.message || "Google login failed",
          ),
        );
      },
    });
    client.requestAccessToken({ prompt: "select_account" });
  });
}
