package com.timebank.timebank.credit;

import com.timebank.timebank.credit.dto.CreditCheckoutResponse;
import com.timebank.timebank.credit.dto.CreditPurchaseAvailabilityResponse;
import com.timebank.timebank.credit.dto.CreditPurchaseCompleteResponse;
import com.timebank.timebank.transaction.TimeTransaction;
import com.timebank.timebank.transaction.TimeTransactionRepository;
import com.timebank.timebank.transaction.TransactionType;
import com.timebank.timebank.user.User;
import com.timebank.timebank.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Saat kredisi satın alma.
 *
 * <p>Güvenlik: Sunucu, gerçek bir ödeme sağlayıcısının (PSP) imzalı onayını doğrulamadan krediyi
 * <b>asla</b> eklememelidir. Henüz PSP entegrasyonu (webhook + imza doğrulaması) olmadığından:
 * <ul>
 *   <li>{@code app.payment.mode=demo}: yerel/test ortamı — ödeme olmadan kredi eklenir (açıkça demo).</li>
 *   <li>Diğer tüm modlar (prod varsayılanı {@code redirect}): satın alma kapalıdır; checkout ve complete
 *       409 döner. Önceden {@code /complete} çağrısı ödeme doğrulamadan kredi ekliyordu.</li>
 * </ul>
 */
@Service
public class CreditPurchaseService {

    private static final Logger log = LoggerFactory.getLogger(CreditPurchaseService.class);
    private static final long SESSION_TTL_SECONDS = 30 * 60;
    static final String PURCHASE_DISABLED_MESSAGE =
            "Saat satın alma şu anda kullanılamıyor. Ders vererek saat kazanabilirsiniz.";

    private final UserRepository userRepository;
    private final TimeTransactionRepository timeTransactionRepository;
    private final boolean demoMode;

    /** Yalnızca demo mod: tek kullanımlık oturumlar (bellek içi). */
    private final Map<String, PendingCheckout> pendingBySession = new ConcurrentHashMap<>();

    public CreditPurchaseService(
            UserRepository userRepository,
            TimeTransactionRepository timeTransactionRepository,
            @Value("${app.payment.mode:redirect}") String paymentMode
    ) {
        this.userRepository = userRepository;
        this.timeTransactionRepository = timeTransactionRepository;
        String mode = paymentMode == null ? "" : paymentMode.trim().toLowerCase(Locale.ROOT);
        this.demoMode = "demo".equals(mode);
        if (!demoMode) {
            log.info("Saat satın alma kapalı (app.payment.mode={}): doğrulanmış PSP entegrasyonu yok.", mode);
        }
    }

    public CreditPurchaseAvailabilityResponse availability() {
        return new CreditPurchaseAvailabilityResponse(demoMode, demoMode);
    }

    @Transactional(readOnly = true)
    public CreditCheckoutResponse startCheckout(String userEmail, String packageId) {
        if (!demoMode) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, PURCHASE_DISABLED_MESSAGE);
        }
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new BadCredentialsException("Kullanıcı bulunamadı"));

        CreditPackageCatalog pkg = CreditPackageCatalog.findById(packageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz paket"));

        purgeExpired();
        String sessionId = UUID.randomUUID().toString();
        pendingBySession.put(sessionId, new PendingCheckout(
                user.getId(),
                pkg,
                Instant.now().plusSeconds(SESSION_TTL_SECONDS)
        ));

        return new CreditCheckoutResponse(
                sessionId,
                pkg.getId(),
                pkg.getDisplayHours(),
                pkg.getDiscountedPriceTry(),
                pkg.getTotalMinutes(),
                "demo",
                true,
                null
        );
    }

    @Transactional
    public CreditPurchaseCompleteResponse completeCheckout(String userEmail, String sessionId) {
        if (!demoMode) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, PURCHASE_DISABLED_MESSAGE);
        }
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new BadCredentialsException("Kullanıcı bulunamadı"));

        PendingCheckout pending = pendingBySession.get(sessionId);
        if (pending == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ödeme oturumu bulunamadı veya süresi doldu");
        }
        if (!pending.userId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu ödeme oturumu size ait değil");
        }
        // Tek kullanımlık: yalnızca sahibi tüketebilir, eşzamanlı ikinci çağrı null alır.
        if (!pendingBySession.remove(sessionId, pending)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ödeme oturumu zaten tamamlandı");
        }
        if (pending.expiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ödeme oturumu süresi doldu");
        }

        CreditPackageCatalog pkg = pending.pkg();
        int minutesToAdd = pkg.getTotalMinutes();
        userRepository.credit(user.getId(), minutesToAdd);

        TimeTransaction tx = new TimeTransaction();
        tx.setUser(user);
        tx.setType(TransactionType.PURCHASE);
        tx.setMinutes(minutesToAdd);
        tx.setDescription("Saat paketi (demo): " + pkg.getId());
        timeTransactionRepository.save(tx);

        return new CreditPurchaseCompleteResponse(
                userRepository.readBalance(user.getId()),
                minutesToAdd,
                pkg.getDisplayHours(),
                pkg.getDiscountedPriceTry()
        );
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        pendingBySession.values().removeIf(p -> p.expiresAt().isBefore(now));
    }

    private record PendingCheckout(
            UUID userId,
            CreditPackageCatalog pkg,
            Instant expiresAt
    ) {
    }
}
