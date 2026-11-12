import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { COOKIE_SESSION_TOKEN } from "../api/client";
import { fetchSession, logoutRequest } from "../api/auth";
import { fetchMyProfile } from "../api/user";

const AUTH_STORAGE_KEY = "tiempos_auth";
const AUTH_SESSION_KEY = "tiempos_auth_session";
const LEGACY_USER_KEY = "tiempos_user";

/** Bellekte Bearer (eski oturum); yeni oturumlar HttpOnly çerez kullanır. */
function userForLocalStorage(u: AuthUser): AuthUser {
  const av = u.avatarUrl;
  if (av != null && av.startsWith("data:")) {
    return { ...u, avatarUrl: null };
  }
  return u;
}

export type AuthUser = {
  id?: string;
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  /** Opsiyonel Bearer; çoğu istekte HttpOnly çerez yeterli. */
  token: string | null;
  isAuthenticated: boolean;
  authReady: boolean;
  login: (user: AuthUser, token?: string | null, rememberMe?: boolean) => void;
  logout: () => void;
  patchUser: (patch: Partial<AuthUser>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readLegacyStoredUser(): AuthUser | null {
  try {
    const tryParse = (raw: string | null) => {
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { user?: AuthUser; token?: string };
      if (parsed?.user?.email && parsed?.user?.name) {
        return parsed.user;
      }
      return null;
    };
    return (
      tryParse(localStorage.getItem(AUTH_STORAGE_KEY)) ??
      tryParse(sessionStorage.getItem(AUTH_SESSION_KEY))
    );
  } catch {
    return null;
  }
}

function clearLegacyAuthStorage() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const persistUserOnly = useCallback((next: AuthUser, rememberMe: boolean) => {
    const payload = JSON.stringify({ user: userForLocalStorage(next) });
    if (rememberMe) {
      localStorage.setItem(AUTH_STORAGE_KEY, payload);
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    } else {
      sessionStorage.setItem(AUTH_SESSION_KEY, payload);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const login = useCallback(
    (next: AuthUser, nextToken?: string | null, rememberMe = true) => {
      setUser(next);
      setToken(nextToken?.trim() ? nextToken.trim() : null);
      persistUserOnly(next, rememberMe);
    },
    [persistUserOnly],
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearLegacyAuthStorage();
    void logoutRequest().catch(() => {
      /* ağ hatası — yerel durum zaten temiz */
    });
  }, []);

  useEffect(() => {
    const onAuthExpired = () => logout();
    window.addEventListener("tiempos:auth-expired", onAuthExpired);
    return () =>
      window.removeEventListener("tiempos:auth-expired", onAuthExpired);
  }, [logout]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await fetchSession();
        if (cancelled) return;
        setUser({
          id: session.userId,
          name: session.fullName,
          email: session.email,
          role: session.role,
        });
        // Çerezle geri yüklenen oturum: sayfalar token beklediği için işaret değeri (başlık eklenmez).
        setToken(COOKIE_SESSION_TOKEN);
        clearLegacyAuthStorage();
      } catch {
        const legacy = readLegacyStoredUser();
        if (!cancelled && legacy) {
          setUser(legacy);
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const patchUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try {
        const raw =
          localStorage.getItem(AUTH_STORAGE_KEY) ??
          sessionStorage.getItem(AUTH_SESSION_KEY);
        if (raw) {
          const storage = localStorage.getItem(AUTH_STORAGE_KEY)
            ? localStorage
            : sessionStorage;
          storage.setItem(
            storage === localStorage ? AUTH_STORAGE_KEY : AUTH_SESSION_KEY,
            JSON.stringify({ user: userForLocalStorage(next) }),
          );
        }
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!authReady || !user || user.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const p = await fetchMyProfile(token);
        if (!cancelled && p?.id) {
          patchUser({ id: p.id });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, user, token, patchUser]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: user !== null,
      authReady,
      login,
      logout,
      patchUser,
    }),
    [user, token, authReady, login, logout, patchUser],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
