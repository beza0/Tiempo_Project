package com.timebank.timebank.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;

/**
 * Çerezle (HttpOnly {@code tiempos_access}) kimliği doğrulanan durum değiştirici isteklerde CSRF savunması.
 *
 * <p>Prod profilinde çerez {@code SameSite=None}; CSRF koruması kapalı (REST). Bu durumda başka bir site,
 * gövdesiz bir form POST'u (ör. {@code /api/users/me/delete}) ile kullanıcının çerezini kullanabilirdi.
 * Tarayıcılar bu tür isteklere {@code Origin} başlığı ekler: başlık varsa ve CORS izin listesinde değilse
 * istek reddedilir. Bearer ile gelen istekler (mobil, eski istemci) CSRF'e açık değildir ve etkilenmez.
 * İzin listesi CORS ile aynıdır; Spring CORS filtresi zaten izinsiz Origin'leri reddettiğinden
 * meşru istemciler için davranış değişmez.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class CookieCsrfOriginFilter extends OncePerRequestFilter {

    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");

    private final CorsConfigurationSource corsConfigurationSource;
    private final AuthCookieService authCookieService;

    public CookieCsrfOriginFilter(
            CorsConfigurationSource corsConfigurationSource,
            AuthCookieService authCookieService
    ) {
        this.corsConfigurationSource = corsConfigurationSource;
        this.authCookieService = authCookieService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (isRejected(request)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"message\":\"İstek kaynağı doğrulanamadı\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean isRejected(HttpServletRequest request) {
        if (SAFE_METHODS.contains(request.getMethod().toUpperCase())) {
            return false;
        }
        String auth = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (auth != null && auth.startsWith("Bearer ")) {
            return false;
        }
        if (authCookieService.readAccessToken(request).isEmpty()) {
            return false;
        }
        String origin = request.getHeader(HttpHeaders.ORIGIN);
        if (origin == null || origin.isBlank() || "null".equals(origin)) {
            // Origin yoksa (eski tarayıcı / aynı origin GET dışı nadir durum) engelleme yapma;
            // "null" Origin'i (sandbox iframe, data: URL) ise reddet.
            return "null".equals(origin);
        }
        if (isSameOrigin(request, origin)) {
            return false;
        }
        CorsConfiguration cfg = corsConfigurationSource.getCorsConfiguration(request);
        return cfg == null || cfg.checkOrigin(origin) == null;
    }

    private static boolean isSameOrigin(HttpServletRequest request, String origin) {
        String forwardedHost = request.getHeader("X-Forwarded-Host");
        String host = forwardedHost != null && !forwardedHost.isBlank()
                ? forwardedHost.split(",")[0].trim()
                : request.getHeader(HttpHeaders.HOST);
        if (host == null) {
            return false;
        }
        String o = origin.toLowerCase();
        String h = host.toLowerCase();
        return o.equals("https://" + h) || o.equals("http://" + h);
    }
}
