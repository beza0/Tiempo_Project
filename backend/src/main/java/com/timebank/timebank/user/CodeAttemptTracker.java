package com.timebank.timebank.user;

import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 6 haneli doğrulama / sıfırlama kodları için e-posta başına hatalı deneme sayacı.
 * IP bazlı hız sınırı (X-Forwarded-For) atlatılsa bile, bir kod en fazla {@link #MAX_FAILURES}
 * yanlış denemeden sonra geçersiz kılınır; kullanıcı yeni kod ister.
 * Bellek içidir: yeniden başlatmada sıfırlanır (kodların zaten süresi dolar).
 */
@Component
public class CodeAttemptTracker {

    public static final int MAX_FAILURES = 5;

    private final Map<String, Integer> failures = new ConcurrentHashMap<>();

    /** @return bu hatayla birlikte limit aşıldı mı (kod geçersiz kılınmalı) */
    public boolean recordFailure(String purpose, String email) {
        int n = failures.merge(key(purpose, email), 1, Integer::sum);
        return n >= MAX_FAILURES;
    }

    public void reset(String purpose, String email) {
        failures.remove(key(purpose, email));
    }

    private static String key(String purpose, String email) {
        return purpose + "|" + (email == null ? "" : email.trim().toLowerCase(Locale.ROOT));
    }
}
