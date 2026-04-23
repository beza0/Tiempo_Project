package com.timebank.timebank.notification;

import com.timebank.timebank.exchange.ExchangeRequest;
import com.timebank.timebank.notification.dto.NotificationResponse;
import com.timebank.timebank.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private static final ZoneId DISPLAY_ZONE = ZoneId.of("Europe/Istanbul");
    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("d MMM yyyy HH:mm").withZone(DISPLAY_ZONE);

    private final UserNotificationRepository userNotificationRepository;

    public NotificationService(UserNotificationRepository userNotificationRepository) {
        this.userNotificationRepository = userNotificationRepository;
    }

    @Transactional
    public void notifyRequestAccepted(ExchangeRequest ex) {
        User requester = ex.getRequester();
        String when = formatWhen(ex.getScheduledStartAt());
        String title = "Talep kabul edildi";
        String body = String.format(
                "\"%s\" için %s başlangıçlı oturum talebiniz kabul edildi.",
                ex.getSkill().getTitle(),
                when
        );
        userNotificationRepository.save(new UserNotification(requester, title, body, ex));
    }

    @Transactional
    public void notifyNewBookingRequest(ExchangeRequest ex) {
        User owner = ex.getSkill().getOwner();
        User requester = ex.getRequester();
        String when = formatWhen(ex.getScheduledStartAt());
        String title = "Yeni rezervasyon talebi";
        String body = String.format(
                "%s — \"%s\" için %s başlangıçlı oturum talep etti.",
                requester.getFullName(),
                ex.getSkill().getTitle(),
                when
        );
        UserNotification n = new UserNotification(owner, title, body, ex);
        userNotificationRepository.save(n);
    }

    @Transactional
    public void sendSessionReminder(ExchangeRequest ex) {
        User owner = ex.getSkill().getOwner();
        User requester = ex.getRequester();
        String when = formatWhen(ex.getScheduledStartAt());
        String title = "Oturum yaklaşıyor";
        String body = String.format(
                "\"%s\" oturumunuz yaklaşık 1 saat sonra (%s).",
                ex.getSkill().getTitle(),
                when
        );
        userNotificationRepository.save(new UserNotification(owner, title, body, ex));
        userNotificationRepository.save(new UserNotification(requester, title, body, ex));
    }

    private static String formatWhen(Instant scheduledStartAt) {
        if (scheduledStartAt == null) {
            return "(tarih seçilmedi)";
        }
        return FMT.format(scheduledStartAt);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listForUser(String email) {
        return userNotificationRepository.findByUserEmailOrderByCreatedAtDesc(email).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countUnread(String email) {
        return userNotificationRepository.countUnreadByUserEmail(email);
    }

    @Transactional
    public void markRead(String email, UUID notificationId) {
        UserNotification n = userNotificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Bildirim bulunamadı"));
        if (!n.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new IllegalArgumentException("Bu bildirime erişim yok");
        }
        if (n.getReadAt() == null) {
            n.setReadAt(Instant.now());
        }
    }

    private NotificationResponse toResponse(UserNotification n) {
        UUID exId = n.getExchangeRequest() != null ? n.getExchangeRequest().getId() : null;
        return new NotificationResponse(
                n.getId(),
                n.getTitle(),
                n.getBody(),
                n.getCreatedAt(),
                n.getReadAt(),
                exId
        );
    }
}
