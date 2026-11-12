package com.timebank.timebank.notification;

import com.timebank.timebank.exchange.ExchangeRequest;
import com.timebank.timebank.exchange.ExchangeRequestRepository;
import com.timebank.timebank.exchange.ExchangeRequestService;
import com.timebank.timebank.exchange.ExchangeRequestStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Kabul edilmiş taleplerde: oturumdan ~1 saat önce hatırlatıcı; başlangıç anında "başladı mı?";
 * ~10 dk önce her iki tarafa seans katılım onayı bildirimi.
 * {@code tiempos.pre-session-demo=true} iken pencere genişletilir (yerel deneme); üretimde false.
 */
@Component
public class BookingReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(BookingReminderScheduler.class);

    private final ExchangeRequestRepository exchangeRequestRepository;
    private final ExchangeRequestService exchangeRequestService;
    private final NotificationService notificationService;
    private final boolean preSessionDemo;

    public BookingReminderScheduler(
            ExchangeRequestRepository exchangeRequestRepository,
            ExchangeRequestService exchangeRequestService,
            NotificationService notificationService,
            @Value("${tiempos.pre-session-demo:false}")
            boolean preSessionDemo
    ) {
        this.exchangeRequestRepository = exchangeRequestRepository;
        this.exchangeRequestService = exchangeRequestService;
        this.notificationService = notificationService;
        this.preSessionDemo = preSessionDemo;
        if (preSessionDemo) {
            log.warn(
                    "tiempos.pre-session-demo=true: seans onayı bildirimleri 10 dk yerine 'şimdi + 7 gün' penceresinde tetiklenir. Üretimde kapatın.");
        }
    }

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void sendReminders() {
        Instant now = Instant.now();
        // Yakalama (catch-up) pencereleri: sunucu uykudan döndüğünde kaçırılan bildirimler de gönderilir.
        // Önceden ±1 dk'lık dar pencere, Render uykusunda bildirimin hiç gitmemesine yol açıyordu.
        Instant windowStart = now;
        Instant windowEnd = now.plus(61, ChronoUnit.MINUTES);
        List<ExchangeRequest> due = exchangeRequestRepository
                .findByStatusAndReminderSentFalseAndScheduledStartAtBetween(
                        ExchangeRequestStatus.ACCEPTED,
                        windowStart,
                        windowEnd
                );
        for (ExchangeRequest ex : due) {
            try {
                notificationService.sendSessionReminder(ex);
                ex.setReminderSent(true);
                exchangeRequestRepository.save(ex);
            } catch (Exception e) {
                log.warn("Reminder failed for exchange {}: {}", ex.getId(), e.getMessage());
            }
        }

        Instant startWindow = now.minus(15, ChronoUnit.MINUTES);
        Instant endWindow = now.plus(1, ChronoUnit.MINUTES);
        List<ExchangeRequest> startDue = exchangeRequestRepository
                .findByStatusAndStartedPromptSentFalseAndScheduledStartAtBetween(
                        ExchangeRequestStatus.ACCEPTED,
                        startWindow,
                        endWindow
                );
        for (ExchangeRequest ex : startDue) {
            try {
                notificationService.sendSessionStartPrompt(ex);
                ex.setStartedPromptSent(true);
                exchangeRequestRepository.save(ex);
            } catch (Exception e) {
                log.warn("Session-start prompt failed for exchange {}: {}", ex.getId(), e.getMessage());
            }
        }

        Instant preStart;
        Instant preEnd;
        if (preSessionDemo) {
            preStart = now;
            preEnd = now.plus(7, ChronoUnit.DAYS);
            log.debug("tiempos.pre-session-demo=true: seans onayı penceresi geniş (şimdi → +7 gün)");
        } else {
            preStart = now;
            preEnd = now.plus(11, ChronoUnit.MINUTES);
        }
        List<ExchangeRequest> preSessionDue = exchangeRequestRepository
                .findByStatusAndPreSessionConfirmSentFalseAndScheduledStartAtBetween(
                        ExchangeRequestStatus.ACCEPTED,
                        preStart,
                        preEnd
                );
        for (ExchangeRequest ex : preSessionDue) {
            if (ex.isInquiryOnly()) {
                continue;
            }
            try {
                notificationService.sendPreSessionConfirmationPrompt(ex);
                ex.setPreSessionConfirmSent(true);
                exchangeRequestRepository.save(ex);
            } catch (Exception e) {
                log.warn("Pre-session confirm prompt failed for exchange {}: {}", ex.getId(), e.getMessage());
            }
        }
    }

    /** Kayıt başına transaction servis içinde açılır; burada dış transaction yoktur. */
    @Scheduled(fixedRate = 60_000)
    public void settleCompletedSessions() {
        try {
            exchangeRequestService.settleDueSessionsAtEnd();
        } catch (Exception e) {
            log.warn("Session end settlement failed: {}", e.getMessage());
        }
    }
}
