package com.timebank.timebank.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Basit IP + yol bazlı hız sınırı (login, iletişim, mesaj gönderimi).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter extends OncePerRequestFilter {

    private final int loginPerMinute;
    private final int contactPerMinute;
    private final int messagesPerMinute;
    private final int codeAttemptsPerMinute;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimitFilter(
            @Value("${app.rate-limit.login-per-minute:20}") int loginPerMinute,
            @Value("${app.rate-limit.contact-per-minute:8}") int contactPerMinute,
            @Value("${app.rate-limit.messages-per-minute:90}") int messagesPerMinute,
            @Value("${app.rate-limit.code-attempts-per-minute:10}") int codeAttemptsPerMinute
    ) {
        this.codeAttemptsPerMinute = codeAttemptsPerMinute;
        this.loginPerMinute = loginPerMinute;
        this.contactPerMinute = contactPerMinute;
        this.messagesPerMinute = messagesPerMinute;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (!HttpMethod.POST.matches(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        Integer limit = resolveLimit(path);
        if (limit == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = clientKey(request) + "|" + path;
        if (!tryConsume(key, limit)) {
            response.setStatus(429);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"message\":\"Çok fazla istek. Lütfen biraz bekleyin.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private Integer resolveLimit(String path) {
        if (path.startsWith("/api/auth/login")
                || path.startsWith("/api/auth/register")
                || path.startsWith("/api/auth/social-login")
                || path.startsWith("/api/auth/forgot-password")) {
            return loginPerMinute;
        }
        // 6 haneli kodlarla çalışan uçlar: kaba kuvvet denemesini sınırla (önceden limitsizdi).
        if (path.startsWith("/api/auth/reset-password")
                || path.startsWith("/api/auth/verify-email")
                || path.startsWith("/api/auth/resend-verification")) {
            return codeAttemptsPerMinute;
        }
        if (path.startsWith("/api/public/contact")) {
            return contactPerMinute;
        }
        if (path.matches(".*/api/exchange-requests/[0-9a-fA-F-]{36}/messages")) {
            return messagesPerMinute;
        }
        return null;
    }

    private static String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private boolean tryConsume(String key, int limit) {
        long epochMinute = Instant.now().getEpochSecond() / 60;
        String windowKey = key + "@" + epochMinute;
        Window w = windows.computeIfAbsent(windowKey, k -> new Window());
        int n = w.count.incrementAndGet();
        if (windows.size() > 20_000) {
            windows.keySet().removeIf(k -> !k.endsWith("@" + epochMinute));
        }
        return n <= limit;
    }

    private static final class Window {
        final AtomicInteger count = new AtomicInteger(0);
    }
}
