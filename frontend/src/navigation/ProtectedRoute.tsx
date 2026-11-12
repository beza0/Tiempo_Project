import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { resolvePostAuthRedirect } from "./postAuthRedirect";
import { PATHS } from "./paths";
import type { ReactNode } from "react";

/** Oturum çerezden geri yüklenirken gösterilen kısa bekleme durumu. */
export function RouteLoading() {
  const { t } = useLanguage();
  return (
    <div className="tp-route-loading" role="status" aria-live="polite">
      <span className="tp-spinner" aria-hidden="true" />
      <span>{t.common.loading}</span>
    </div>
  );
}

/**
 * Giriş gerektiren sayfa. Oturum (HttpOnly çerez) geri yüklenene kadar beklenir;
 * aksi halde sayfa yenileme, e-posta linki veya ödeme dönüşü önce /login'e, oradan
 * /dashboard'a düşüp hedefini kaybediyordu.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, authReady } = useAuth();
  const location = useLocation();
  if (!authReady) {
    return <RouteLoading />;
  }
  if (!isAuthenticated) {
    return (
      <Navigate
        to={PATHS.login}
        replace
        state={{ from: { pathname: location.pathname, search: location.search } }}
      />
    );
  }
  return <>{children}</>;
}

/** Giriş / kayıt: oturum açıksa kullanıcıyı geldiği hedefe (yoksa panele) gönderir. */
export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (isAuthenticated) {
    return (
      <Navigate to={resolvePostAuthRedirect(location.state, PATHS.dashboard)} replace />
    );
  }
  return <>{children}</>;
}
