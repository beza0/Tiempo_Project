package com.timebank.timebank.exchange;

import com.timebank.timebank.exchange.dto.CreateExchangeMessageRequest;
import com.timebank.timebank.exchange.dto.CreateExchangeRequestRequest;
import com.timebank.timebank.exchange.dto.ExchangeMessageResponse;
import com.timebank.timebank.exchange.dto.ExchangeRequestResponse;
import com.timebank.timebank.skill.Skill;
import com.timebank.timebank.skill.SkillRepository;
import com.timebank.timebank.transaction.TimeTransaction;
import com.timebank.timebank.transaction.TimeTransactionRepository;
import com.timebank.timebank.transaction.TransactionType;
import com.timebank.timebank.notification.NotificationService;
import com.timebank.timebank.user.User;
import com.timebank.timebank.user.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class ExchangeRequestService {
    private static final ZoneId SCHEDULE_ZONE = ZoneId.of("Europe/Istanbul");

    private final ExchangeRequestRepository exchangeRequestRepository;
    private final ExchangeMessageRepository exchangeMessageRepository;
    private final SkillRepository skillRepository;
    private final UserRepository userRepository;
    private final TimeTransactionRepository timeTransactionRepository;
    private final NotificationService notificationService;

    public ExchangeRequestService(
            ExchangeRequestRepository exchangeRequestRepository,
            ExchangeMessageRepository exchangeMessageRepository,
            SkillRepository skillRepository,
            UserRepository userRepository,
            TimeTransactionRepository timeTransactionRepository,
            NotificationService notificationService
    ) {
        this.exchangeRequestRepository = exchangeRequestRepository;
        this.exchangeMessageRepository = exchangeMessageRepository;
        this.skillRepository = skillRepository;
        this.userRepository = userRepository;
        this.timeTransactionRepository = timeTransactionRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public ExchangeRequestResponse createRequest(UUID skillId, CreateExchangeRequestRequest req, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new BadCredentialsException("Kullanıcı bulunamadı"));

        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new IllegalArgumentException("Skill bulunamadı"));

        if (skill.getOwner().getEmail().equalsIgnoreCase(requesterEmail)) {
            throw new IllegalArgumentException("Kendi skill'inize talep gönderemezsiniz");
        }

        int booked = req.getBookedMinutes();
        if (booked < 30) {
            throw new IllegalArgumentException("Rezervasyon süresi en az 30 dakika olmalıdır");
        }

        Instant scheduled = req.getScheduledStartAt();
        Instant minStart = Instant.now().plus(1, ChronoUnit.HOURS);
        if (scheduled.isBefore(minStart)) {
            throw new IllegalArgumentException("Oturum başlangıcı en az 1 saat sonrası için seçilmelidir");
        }
        validateScheduleAgainstSkillAvailability(skill, scheduled);

        ExchangeRequest exchangeRequest = new ExchangeRequest();
        exchangeRequest.setSkill(skill);
        exchangeRequest.setRequester(requester);
        exchangeRequest.setMessage(req.getMessage().trim());
        exchangeRequest.setBookedMinutes(booked);
        exchangeRequest.setScheduledStartAt(scheduled);
        exchangeRequest.setReminderSent(false);
        exchangeRequest.setPendingFromOwner(false);
        exchangeRequest.setStatus(ExchangeRequestStatus.PENDING);

        ExchangeRequest saved = exchangeRequestRepository.save(exchangeRequest);
        notificationService.notifyNewBookingRequest(saved);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ExchangeRequestResponse> getMySentRequests(String userEmail) {
        return exchangeRequestRepository.findByRequesterEmailOrderByCreatedAtDesc(userEmail)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ExchangeRequestResponse> getMyReceivedRequests(String userEmail) {
        return exchangeRequestRepository.findBySkillOwnerEmailOrderByCreatedAtDesc(userEmail)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public ExchangeRequestResponse acceptRequest(UUID requestId, String ownerEmail) {
        ExchangeRequest exchangeRequest = exchangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadı"));

        if (!exchangeRequest.getSkill().getOwner().getEmail().equalsIgnoreCase(ownerEmail)) {
            throw new IllegalArgumentException("Bu talebi kabul etme yetkiniz yok");
        }

        if (exchangeRequest.getStatus() != ExchangeRequestStatus.PENDING) {
            throw new IllegalArgumentException("Sadece bekleyen talepler kabul edilebilir");
        }

        exchangeRequest.setStatus(ExchangeRequestStatus.ACCEPTED);
        ExchangeRequest updated = exchangeRequestRepository.save(exchangeRequest);
        notificationService.notifyRequestAccepted(updated);

        return mapToResponse(updated);
    }

    @Transactional
    public ExchangeRequestResponse rejectRequest(UUID requestId, String ownerEmail) {
        ExchangeRequest exchangeRequest = exchangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadı"));

        if (!exchangeRequest.getSkill().getOwner().getEmail().equalsIgnoreCase(ownerEmail)) {
            throw new IllegalArgumentException("Bu talebi reddetme yetkiniz yok");
        }

        if (exchangeRequest.getStatus() != ExchangeRequestStatus.PENDING) {
            throw new IllegalArgumentException("Sadece bekleyen talepler reddedilebilir");
        }

        exchangeRequest.setStatus(ExchangeRequestStatus.REJECTED);
        ExchangeRequest updated = exchangeRequestRepository.save(exchangeRequest);

        return mapToResponse(updated);
    }

    @Transactional
    public ExchangeRequestResponse counterOfferRequest(
            UUID requestId,
            CreateExchangeRequestRequest req,
            String ownerEmail
    ) {
        ExchangeRequest original = exchangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadı"));

        if (!original.getSkill().getOwner().getEmail().equalsIgnoreCase(ownerEmail)) {
            throw new IllegalArgumentException("Bu talep için yeni tarih önerme yetkiniz yok");
        }
        if (original.getStatus() != ExchangeRequestStatus.REJECTED) {
            throw new IllegalArgumentException("Yeni tarih önerisi için önce talep reddedilmiş olmalı");
        }

        int booked = req.getBookedMinutes();
        if (booked != original.getBookedMinutes()) {
            throw new IllegalArgumentException("Yeni teklif, mevcut rezervasyon süresiyle aynı olmalı");
        }

        Instant scheduled = req.getScheduledStartAt();
        Instant minStart = Instant.now().plus(1, ChronoUnit.HOURS);
        if (scheduled.isBefore(minStart)) {
            throw new IllegalArgumentException("Oturum başlangıcı en az 1 saat sonrası için seçilmelidir");
        }
        validateScheduleAgainstSkillAvailability(original.getSkill(), scheduled);

        ExchangeRequest newReq = new ExchangeRequest();
        newReq.setSkill(original.getSkill());
        newReq.setRequester(original.getRequester());
        newReq.setMessage(req.getMessage().trim());
        newReq.setBookedMinutes(original.getBookedMinutes());
        newReq.setScheduledStartAt(scheduled);
        newReq.setReminderSent(false);
        newReq.setPendingFromOwner(true);
        newReq.setStatus(ExchangeRequestStatus.PENDING);

        ExchangeRequest saved = exchangeRequestRepository.save(newReq);
        notificationService.notifyCounterOffer(saved);
        return mapToResponse(saved);
    }

    @Transactional
    public ExchangeRequestResponse completeRequest(UUID requestId, String ownerEmail) {
        ExchangeRequest exchangeRequest = exchangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadı"));

        if (!exchangeRequest.getSkill().getOwner().getEmail().equalsIgnoreCase(ownerEmail)) {
            throw new IllegalArgumentException("Bu talebi tamamlama yetkiniz yok");
        }

        if (exchangeRequest.getStatus() != ExchangeRequestStatus.ACCEPTED) {
            throw new IllegalArgumentException("Sadece kabul edilmiş talepler tamamlanabilir");
        }

        User provider = exchangeRequest.getSkill().getOwner();
        User requester = exchangeRequest.getRequester();
        int minutes = exchangeRequest.getBookedMinutes();

        if (requester.getTimeCreditMinutes() < minutes) {
            throw new IllegalArgumentException("Talep sahibinin saat bakiyesi bu süre için yetersiz");
        }

        requester.setTimeCreditMinutes(requester.getTimeCreditMinutes() - minutes);
        provider.setTimeCreditMinutes(provider.getTimeCreditMinutes() + minutes);

        exchangeRequest.setStatus(ExchangeRequestStatus.COMPLETED);

        TimeTransaction spendTx = new TimeTransaction();
        spendTx.setUser(requester);
        spendTx.setExchangeRequest(exchangeRequest);
        spendTx.setType(TransactionType.SPEND);
        spendTx.setMinutes(minutes);
        spendTx.setDescription("Hizmet alma karşılığı zaman harcandı");

        TimeTransaction earnTx = new TimeTransaction();
        earnTx.setUser(provider);
        earnTx.setExchangeRequest(exchangeRequest);
        earnTx.setType(TransactionType.EARN);
        earnTx.setMinutes(minutes);
        earnTx.setDescription("Hizmet verme karşılığı zaman kazanıldı");

        userRepository.save(requester);
        userRepository.save(provider);
        exchangeRequestRepository.save(exchangeRequest);
        timeTransactionRepository.save(spendTx);
        timeTransactionRepository.save(earnTx);

        return mapToResponse(exchangeRequest);
    }

    @Transactional(readOnly = true)
    public List<ExchangeMessageResponse> listMessages(UUID exchangeRequestId, String userEmail) {
        ExchangeRequest ex = exchangeRequestRepository.findById(exchangeRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadı"));
        if (!isParticipant(ex, userEmail)) {
            throw new IllegalArgumentException("Bu konuşmaya erişim yok");
        }
        return exchangeMessageRepository.findByExchangeRequest_IdOrderByCreatedAtAsc(exchangeRequestId)
                .stream()
                .map(this::mapMessage)
                .toList();
    }

    @Transactional
    public ExchangeMessageResponse sendMessage(
            UUID exchangeRequestId,
            CreateExchangeMessageRequest req,
            String userEmail
    ) {
        ExchangeRequest ex = exchangeRequestRepository.findById(exchangeRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadı"));
        if (ex.getStatus() == ExchangeRequestStatus.PENDING && !ex.isPendingFromOwner()) {
            throw new IllegalArgumentException("Talep beklemedeyken mesaj gönderilemez");
        }
        if (!isParticipant(ex, userEmail)) {
            throw new IllegalArgumentException("Bu konuşmaya erişim yok");
        }
        User sender = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BadCredentialsException("Kullanıcı bulunamadı"));
        ExchangeMessage msg = new ExchangeMessage();
        msg.setExchangeRequest(ex);
        msg.setSender(sender);
        msg.setBody(req.getBody().trim());
        ExchangeMessage saved = exchangeMessageRepository.save(msg);
        return mapMessage(saved);
    }

    private static boolean isParticipant(ExchangeRequest ex, String email) {
        return ex.getRequester().getEmail().equalsIgnoreCase(email)
                || ex.getSkill().getOwner().getEmail().equalsIgnoreCase(email);
    }

    private static void validateScheduleAgainstSkillAvailability(Skill skill, Instant scheduledStartAt) {
        if (skill.getAvailableDays() == null || skill.getAvailableFrom() == null || skill.getAvailableUntil() == null) {
            return;
        }
        var local = scheduledStartAt.atZone(SCHEDULE_ZONE);
        String day = local.getDayOfWeek().name().toUpperCase(Locale.ROOT);
        List<String> allowedDays = Arrays.stream(skill.getAvailableDays().split(","))
                .map(String::trim)
                .map(s -> s.toUpperCase(Locale.ROOT))
                .filter(s -> !s.isEmpty())
                .toList();
        if (!allowedDays.contains(day)) {
            throw new IllegalArgumentException("Seçilen gün eğitmenin uygun günleri arasında değil");
        }
        LocalTime start = local.toLocalTime().withSecond(0).withNano(0);
        LocalTime from = LocalTime.parse(skill.getAvailableFrom());
        LocalTime until = LocalTime.parse(skill.getAvailableUntil());
        if (start.isBefore(from) || !start.isBefore(until)) {
            throw new IllegalArgumentException("Seçilen saat eğitmenin uygun saat aralığında değil");
        }
    }

    private ExchangeMessageResponse mapMessage(ExchangeMessage m) {
        return new ExchangeMessageResponse(
                m.getId(),
                m.getSender().getId(),
                m.getSender().getFullName(),
                m.getBody(),
                m.getCreatedAt()
        );
    }

    private ExchangeRequestResponse mapToResponse(ExchangeRequest exchangeRequest) {
        return new ExchangeRequestResponse(
                exchangeRequest.getId(),
                exchangeRequest.getSkill().getId(),
                exchangeRequest.getSkill().getTitle(),
                exchangeRequest.getRequester().getId(),
                exchangeRequest.getRequester().getFullName(),
                exchangeRequest.getSkill().getOwner().getId(),
                exchangeRequest.getSkill().getOwner().getFullName(),
                exchangeRequest.getMessage(),
                exchangeRequest.getBookedMinutes(),
                exchangeRequest.getScheduledStartAt(),
                exchangeRequest.isPendingFromOwner(),
                exchangeRequest.getStatus(),
                exchangeRequest.getCreatedAt()
        );
    }
}