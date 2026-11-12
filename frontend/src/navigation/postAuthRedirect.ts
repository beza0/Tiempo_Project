/**
 * Login / kayıt sonrası yönlendirme: ProtectedRoute'un bıraktığı location.state.from
 * (örn. doğrudan /buy-credits açıldığında).
 */
export type AuthLocationState = {
  from?: { pathname?: string; search?: string };
};

/**
 * Güvenli iç URL: açık yönlendirme (open redirect) yok; yalnızca mutlak yol + isteğe bağlı ?query.
 */
export function resolvePostAuthRedirect(
  locationState: unknown,
  fallback: string,
): string {
  const st = locationState as AuthLocationState | null | undefined;
  const pathname = st?.from?.pathname;
  if (!pathname || typeof pathname !== "string") {
    return fallback;
  }
  const p = pathname.trim();
  // Ters eğik çizgi: bazı tarayıcılar "/\\evil.com" yolunu "//evil.com" gibi yorumlar (açık yönlendirme).
  if (!p.startsWith("/") || p.startsWith("//") || p.includes("..") || p.includes("\\")) {
    return fallback;
  }
  const rawSearch = st?.from?.search;
  const search =
    rawSearch && typeof rawSearch === "string" && rawSearch.startsWith("?")
      ? rawSearch
      : "";
  return `${p}${search}`;
}
