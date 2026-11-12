package com.timebank.timebank.exchange;

import com.timebank.timebank.exchange.dto.CancelSurveyRequest;
import com.timebank.timebank.exchange.dto.CreateExchangeMessageRequest;
import com.timebank.timebank.exchange.dto.CreateExchangeRequestRequest;
import com.timebank.timebank.exchange.dto.ExchangeMessageResponse;
import com.timebank.timebank.exchange.dto.ExchangeRequestResponse;
import com.timebank.timebank.exchange.dto.PendingCancelSurveyDockResponse;
import com.timebank.timebank.exchange.dto.SessionProblemReportRequest;
import com.timebank.timebank.exchange.dto.UpdateSessionMeetingRequest;
import com.timebank.timebank.skill.Skill;
import com.timebank.timebank.skill.SkillRepository;
import com.timebank.timebank.transaction.TimeTransaction;
import com.timebank.timebank.transaction.TimeTransactionRepository;
import com.timebank.timebank.transaction.TransactionType;
import com.timebank.timebank.notification.NotificationService;
import com.timebank.timebank.user.UserBlockRepository;
import com.timebank.timebank.user.User;
import com.timebank.timebank.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ExchangeRequestService {
    private static final ZoneId SCHEDULE_ZONE = ZoneId.of("Europe/Istanbul");
    private static final Logger log = LoggerFactory.getLogger(ExchangeRequestService.class);

    /**
     * Bitişten sonra katılım onayı için tanınan süre. Bu süre dolduğunda kredisi kesinleşmemiş
     * (iki taraf da seans öncesi onay vermemiş ve katılım onaylanmamış) oturum öğrenciye tam iade edilir.
     */
    static final long UNCONFIRMED_SESSION_GRACE_HOURS = 24;

    private final ExchangeRequestRepository exchangeRequestRepository;
    private final ExchangeMessageRepository exchangeMessageRepository;
    private final SkillRepository skillRepository;
    private final UserRepository userRepository;
    private final TimeTransactionRepository timeTransactionRepository;
    private final NotificationService notificationService;
    private final UserBlockRepository userBlockRepository;
    private final ExchangeCancelSurveyRepository exchangeCancelSurveyRepository;
    private final boolean preSessionDemo;
    private final TransactionTemplate perRecordTx;

    private static final Set<String> CANCEL_SURVEY_REASONS = Set.of("SCHEDULE", "NOT_NEEDED", "OTHER");

    public ExchangeRequestService(
            ExchangeRequestRepository exchangeRequestRepository,
            ExchangeMessageRepository exchangeMessageRepository,
            SkillRepository skillRepository,
            UserRepository userRepository,
            TimeTransactionRepository timeTransactionRepository,
            NotificationService notificationService,
            UserBlockRepository userBlockRepository,
            ExchangeCancelSurveyRepository exchangeCancelSurveyRepository,
            PlatformTransactionManager transactionManager,
            @Value("${tiempos.pre-session-demo:false}") boolean preSessionDemo
    ) {
        this.perRecordTx = new TransactionTemplate(transactionManager);
        this.perRecordTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.exchangeRequestRepository = exchangeRequestRepository;
        this.exchangeMessageRepository = exchangeMessageRepository;
        this.skillRepository = skillRepository;
        this.userRepository = userRepository;
        this.timeTransactionRepository = timeTransactionRepository;
        this.notificationService = notificationService;
        this.userBlockRepository = userBlockRepository;
        this.exchangeCancelSurveyRepository = exchangeCancelSurveyRepository;
        this.preSessionDemo = preSessionDemo;
    }

    @Transactional
    public ExchangeRequestResponse createRequest(UUID skillId, CreateExchangeRequestRequest req, String requesterEmail) {
        User requester = userRepository.findByEmailIgnoreCase(requesterEmail)
                .orElseThrow(() -> new BadCredentialsException("Kullanıcı bulunamadı"));

        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new IllegalArgumentException("Skill bulunamadı"));

        if (skill.getOwner().getEmail().equalsIgnoreCase(requesterEmail)) {
            throw new IllegalArgumentException("Kendi skill'inize talep gönderemezsiniz");
        }

        boolean inquiry = Boolean.TRUE.equals(req.getInquiryOnly());
        int booked = req.getBookedMinutes();
        if (booked < 30) {
            throw new IllegalArgumentException("Rezervasyon süresi en az 30 dakika olmalıdır");
        }
        if (!inquiry && requester.getTimeCreditMinutes() < booked) {
            throw new IllegalArgumentException("Saat bakiyeniz bu süre için yetersiz");
        }

        Instant scheduled = req.getScheduledStartAt();
        Instant minStart = Instant.now().plus(1, ChronoUnit.HOURS);
        if (scheduled.isBefore(minStart)) {
            throw new IllegalArgumentException("Oturum başlangıcı en az 1 saat sonrası için seçilmelidir");
        }
        // inquiryOnly: yalnızca eğitmene ilk mesaj / tanışma — önerilen slot bilgilendirme amaçlı;
        // beceri takvimi ve onaylı oturum çakışması rezervasyon (book) akışında zorunlu.
        if (!inquiry) {
            validateScheduleAgainstSkillAvailability(skill, scheduled);
            assertNoAcceptScheduleConflict(
                    requester,
                    skill.getOwner(),
                    scheduled,
                    booked,
                    null
            );
        }

        ExchangeRequest exchangeRequest = new ExchangeRequest();
        exchangeRequest.setSkill(skill);
        exchangeRequest.setRequester(requester);
        exchangeRequest.setMessage(req.getMessage().trim());
        exchangeRequest.setBookedMinutes(booked);
        exchangeRequest.setScheduledStartAt(scheduled);
        exchangeRequest.setReminderSent(false);
        exchangeRequest.setStartedPromptSent(false);
        exchangeRequest.setPendingFromOwner(false);
        exchangeRequest.setInquiryOnly(inquiry);
        exchangeRequest.setRequesterCreditHeld(false);
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
    public ExchangeRequestResponse acceptRequest(UUID requestId, String userEmail) {
        ExchangeRequest exchangeRequest = exchangeRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadı"));

        if (exchangeRequest.getStatus() != ExchangeRequestStatus.PENDING) {
            throw new IllegalArgumentException("Sadece bekleyen talepler kabul edilebilir");
        }

        boolean isOwner = exchangeRequest.getSkill().getOwner().getEmail().equalsIgnoreCase(userEmail);
        boolean isRequester = exchangeRequest.getRequester().getEmail().equalsIgnoreCase(userEmail);
        if (exchangeRequest.isPendingFromOwner()) {
            if (!isRequester) {
                throw new IllegalArgumentException("Bu talebi kabul etme yetkiniz yok");
            }
        } else {
            if (!isOwner) {
                throw new IllegalArgumentException("Bu talebi kabul etme yetkiniz yok");
            }
        }

        // İki katılımcının satırları sabit sırayla kilitlenir: aynı kişiyi içeren eşzamanlı kabuller
        // sıraya girer, çakışma kontrolü ve bakiye düşümü tutarlı kalır.
        lockParticipants(exchangeRequest.getRequester(), exchangeRequest.getSkill().getOwner());
        assertNoAcceptScheduleConflict(
                exchangeRequest.getRequester(),
                exchangeRequest.getSkill().getOwner(),
                exchangeRequest.getScheduledStartAt(),
                exchangeRequest.getBookedMinutes(),
                exchangeRequest.getId()
        );

        if (!exchangeRequest.isRequesterCreditHeld()) {
            int booked = exchangeRequest.getBookedMinutes();
            if (userRepository.debitIfSufficient(exchangeRequest.getRequester().getId(), booked) == 0) {
                throw new IllegalArgumentException("Saat bakiyeniz bu süre için yetersiz");
            }
            exchangeRequest.setRequesterCreditHeld(true);
        }
        exchangeRequest.setStatus(ExchangeRequestStatus.ACCEPTED);
        ExchangeRequest updated = exchangeRequestRepository.save(exchangeRequest);
        notificationService.notifyRequestAccepted(updated);

        return mapToResponse(updated);
    }

    @Transactional
    public ExchangeRequestResponse rejectRequest(UUID requestId, String userEmail) {
        ExchangeRequest exchangeRequest = exchangeRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadı"));

        if (exchangeRequest.getStatus() != ExchangeRequestStatus.PENDING) {
            throw new IllegalArgumentException("Sadece bekleyen talepler reddedilebilir");
        }

        boolean isOwner = exchangeRequest.getSkill().getOwner().getEmail().equalsIgnoreCase(userEmail);
        boolean isRequester = exchangeRequest.getRequester().getEmail().equalsIgnoreCase(userEmail);
        if (exchangeRequest.isPendingFromOwner()) {
            // Eğitmenin yeni tarih teklifi: yanıt verecek taraf öğrenci (talep sahibi).
            if (!isRequester) {
                throw new IllegalArgumentException("Bu talebi reddetme yetkiniz yok");
            }
        } else {
            // İlk talep: yanıt verecek taraf eğitmen (beceri sahibi).
            if (!isOwner) {
                throw new IllegalArgumentException("Bu talebi reddetme yetkiniz yok");
            }
        }

        exchangeRequest.setStatus(ExchangeRequestStatus.REJECTED);
        releaseHeldCreditIfAny(exchangeRequest);
        ExchangeRequest updated = exchangeRequestRepository.save(exchangeRequest);

        return mapToResponse(updated);
    }

    /**
     * PENDING: yalnızca talep sahibi (geri çek). ACCEPTED: dersi veren veya alan, planlanan başlangıç anından önce.
     */
    @Transactional
    public ExchangeRequestResponse cancelRequest(UUID requestId, String userEmail) {
        String email = userEmail == null ? "" : userEmail.trim();
        if (email.isEmpty()) {
            throw new IllegalArgumentException("Kullanıcı e-postası gerekli");
        }
        ExchangeRequest ex = exchangeRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadı"));

        boolean isRequester = ex.getRequester().getEmail().equalsIgnoreCase(email);
        boolean isOwner = ex.getSkill().getOwner().getEmail().equalsIgnoreCase(email);
        if (!isRequester && !isOwner) {
            throw new IllegalArgumentException("Bu talebi iptal etme yetkiniz yok");
        }

        ExchangeRequestStatus st = ex.getStatus();
        if (st == ExchangeRequestStatus.CANCELLED) {
            return mapToResponse(ex);
        }
        if (st == ExchangeRequestStatus.COMPLETED) {
            throw new IllegalArgumentException("Tamamlanmış oturumlar iptal edilemez");
        }
        if (st == ExchangeRequestStatus.REJECTED) {
            throw new IllegalArgumentException("Bu talep zaten reddedildi");
        }

        if (st == ExchangeRequestStatus.PENDING) {
            if (!isRequester) {
                throw new IllegalArgumentException("Bekleyen talebi yalnızca talep sahibi iptal edebilir (eğitmen red veya yanıt verebilir)");
            }
        } else if (st == ExchangeRequestStatus.ACCEPTED) {
            Instant start = ex.getScheduledStartAt();
            if (start != null && !Instant.now().isBefore(start)) {
                throw new IllegalArgumentException("Oturum başlangıç zamanı geçti; iptal edilemez");
            }
        } else {
            throw new IllegalArgumentException("Bu durumdaki talep iptal edilemez");
        }

        markCancelled(ex);
        exchangeRequestRepository.save(ex);
        notificationService.notifyExchangeCancelled(ex, userEmail);
        return mapToResponse(ex);
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
        // Skill meta'daki müsait gün/saat yalnızca öğrencinin ilk talebi ve öğrenci karşı teklifi için geçerlidir;
        // eğitmen reddettikten sonra yeni tarih önerirken kendi takvimini serbestçe seçebilir (çakışma kontrolü aşağıda).
        assertNoAcceptScheduleConflict(
                original.getRequester(),
                original.getSkill().getOwner(),
                scheduled,
                original.getBookedMinutes(),
                null
        );

        ExchangeRequest newReq = new ExchangeRequest();
        newReq.setSkill(original.getSkill());
        newReq.setRequester(original.getRequester());
        newReq.setMessage(req.getMessage().trim());
        newReq.setBookedMinutes(original.getBookedMinutes());
        newReq.setScheduledStartAt(scheduled);
        newReq.setReminderSent(false);
        newReq.setStartedPromptSent(false);
        newReq.setPendingFromOwner(true);
        newReq.setRequesterCreditHeld(false);
        newReq.setStatus(ExchangeRequestStatus.PENDING);

        ExchangeRequest saved = exchangeRequestRepository.save(newReq);
        notificationService.notifyCounterOffer(saved);
        return mapToResponse(saved);
    }

    /**
     * Öğrenci, eğitmenin reddedilmiş karşı teklifinden sonra yeni tarih/saat önerir (bekleyen satır: pendingFromOwner=false).
     */
    @Transactional
    public ExchangeRequestResponse requesterCounterOfferRequest(
            UUID requestId,
            CreateExchangeRequestRequest req,
            String requesterEmail
    ) {
        ExchangeRequest original = exchangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadı"));

        if (!original.getRequester().getEmail().equalsIgnoreCase(requesterEmail)) {
            throw new IllegalArgumentException("Bu talep için yeni tarih önerme yetkiniz yok");
        }
        if (original.getStatus() != ExchangeRequestStatus.REJECTED) {
            throw new IllegalArgumentException("Yeni tarih önerisi için önce talep reddedilmiş olmalı");
        }
        if (!original.isPendingFromOwner()) {
            throw new IllegalArgumentException(
                    "Bu yanıt yalnızca eğitmenin son teklifini reddettikten sonra kullanılabilir");
        }

        User requester = original.getRequester();
        Skill skill = original.getSkill();

        int booked = req.getBookedMinutes();
        if (booked < 30) {
            throw new IllegalArgumentException("Rezervasyon süresi en az 30 dakika olmalıdır");
        }
        if (booked != original.getBookedMinutes()) {
            throw new IllegalArgumentException("Yeni teklif, mevcut rezervasyon süresiyle aynı olmalı");
        }
        if (requester.getTimeCreditMinutes() < booked) {
            throw new IllegalArgumentException("Saat bakiyeniz bu süre için yetersiz");
        }

        Instant scheduled = req.getScheduledStartAt();
        Instant minStart = Instant.now().plus(1, ChronoUnit.HOURS);
        if (scheduled.isBefore(minStart)) {
            throw new IllegalArgumentException("Oturum başlangıcı en az 1 saat sonrası için seçilmelidir");
        }
        validateScheduleAgainstSkillAvailability(skill, scheduled);
        assertNoAcceptScheduleConflict(
                requester,
                skill.getOwner(),
                scheduled,
                booked,
                null
        );

        ExchangeRequest newReq = new ExchangeRequest();
        newReq.setSkill(skill);
        newReq.setRequester(requester);
        newReq.setMessage(req.getMessage().trim());
        newReq.setBookedMinutes(booked);
        newReq.setScheduledStartAt(scheduled);
        newReq.setReminderSent(false);
        newReq.setStartedPromptSent(false);
        newReq.setPendingFromOwner(false);
        newReq.setRequesterCreditHeld(false);
        newReq.setStatus(ExchangeRequestStatus.PENDING);

        ExchangeRequest saved = exchangeRequestRepository.save(newReq);
        notificationService.notifyNewBookingRequest(saved);
        return mapToResponse(saved);
    }

    @Transactional
    public ExchangeRequestResponse completeRequest(UUID requestId, String ownerEmail) {
        ExchangeRequest exchangeRequest = exchangeRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadı"));

        if (!exchangeRequest.getSkill().getOwner().getEmail().equalsIgnoreCase(ownerEmail)) {
            throw new IllegalArgumentException("Bu talebi tamamlama yetkiniz yok");
        }

        if (exchangeRequest.getStatus() != ExchangeRequestStatus.ACCEPTED) {
            throw new IllegalArgumentException("Sadece kabul edilmiş talepler tamamlanabilir");
        }
        assertSessionStarted(exchangeRequest);
        if (exchangeRequest.getOwnerAttendanceAckAt() == null) {
            exchangeRequest.setOwnerAttendanceAckAt(Instant.now());
        }
        settleIfBothAttendanceAcked(exchangeRequest);
        exchangeRequestRepository.save(exchangeRequest);
        return mapToResponse(exchangeRequest);
    }

    /**
     * Kabul edilmiş oturum: eğitmen (beceri sahibi) toplantı linki ekler/günceller.
     */
    @Transactional
    public ExchangeRequestResponse updateSessionMeeting(
            UUID requestId,
            UpdateSessionMeetingRequest req,
            String userEmail
    ) {
        ExchangeRequest ex = exchangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadı"));
        if (!ex.getSkill().getOwner().getEmail().equalsIgnoreCase(userEmail)) {
            throw new IllegalArgumentException("Oturum linkini yalnızca eğitmen (beceri sahibi) güncelleyebilir");
        }
        if (ex.getStatus() != ExchangeRequestStatus.ACCEPTED) {
            throw new IllegalArgumentException("Sadece onaylanmış oturumlar için link eklenebilir");
        }
        String u = req.getMeetingUrl() == null ? null : req.getMeetingUrl().trim();
        ex.setSessionMeetingUrl(u == null || u.isEmpty() ? null : u);
        exchangeRequestRepository.save(ex);
        return mapToResponse(ex);
    }

    /**
     * Talep sahibi (öğrenci) oturumun başladığını işaretler.
     */
    @Transactional
    public ExchangeRequestResponse acknowledgeRequesterAttendance(
            UUID requestId,
            String userEmail
    ) {
        ExchangeRequest ex = exchangeRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadı"));
        if (!ex.getRequester().getEmail().equalsIgnoreCase(userEmail)) {
            throw new IllegalArgumentException("Bu oturum için sadece talep sahibi onay verebilir");
        }
        if (ex.getStatus() != ExchangeRequestStatus.ACCEPTED) {
            throw new IllegalArgumentException("Sadece onaylanmış oturumlar için katılım onayı verilebilir");
        }
        assertSessionStarted(ex);
        if (ex.getRequesterAttendanceAckAt() == null) {
            ex.setRequesterAttendanceAckAt(Instant.now());
        }
        settleIfBothAttendanceAcked(ex);
        exchangeRequestRepository.save(ex);
        return mapToResponse(ex);
    }

    @Transactional
    public ExchangeRequestResponse acknowledgeOwnerAttendance(
            UUID requestId,
            String userEmail
    ) {
        ExchangeRequest ex = exchangeRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadı"));
        if (!ex.getSkill().getOwner().getEmail().equalsIgnoreCase(userEmail)) {
            throw new IllegalArgumentException("Bu oturum için sadece eğitmen onay verebilir");
        }
        if (ex.getStatus() != ExchangeRequestStatus.ACCEPTED) {
            throw new IllegalArgumentException("Sadece onaylanmış oturumlar için katılım onayı verilebilir");
        }
        assertSessionStarted(ex);
        if (ex.getOwnerAttendanceAckAt() == null) {
            ex.setOwnerAttendanceAckAt(Instant.now());
        }
        settleIfBothAttendanceAcked(ex);
        exchangeRequestRepository.save(ex);
        return mapToResponse(ex);
    }

    @Transactional(readOnly = true)
    public List<ExchangeRequestResponse> listOpenPreSessionConfirmations(String userEmail) {
        String email = userEmail == null ? "" : userEmail.trim();
        if (email.isEmpty()) {
            return List.of();
        }
        Instant now = Instant.now();
        return exchangeRequestRepository
                .findOpenPreSessionConfirmationsForParticipant(ExchangeRequestStatus.ACCEPTED, email)
                .stream()
                .filter(ex -> shouldShowInSessionDock(ex, now))
                .map(ex -> mapToResponse(ex, now))
                .toList();
    }

    /**
     * Oturum sırasında sorun bildirimi: geçen süre kadar kısmi saat aktarımı, kalan askı iade.
     */
    @Transactional
    public ExchangeRequestResponse reportSessionProblem(
            UUID requestId,
            SessionProblemReportRequest req,
            String userEmail
    ) {
        ExchangeRequest ex = exchangeRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadı"));
        if (!isParticipant(ex, userEmail)) {
            throw new IllegalArgumentException("Bu oturumda değilsiniz");
        }
        if (ex.getStatus() != ExchangeRequestStatus.ACCEPTED) {
            throw new IllegalArgumentException("Sadece devam eden oturumlar için geçerlidir");
        }
        if (ex.getPreSessionBothConfirmedAt() == null) {
            throw new IllegalArgumentException("Önce her iki tarafın seans öncesi onayı gerekir");
        }
        if (ex.getCreditsSettledAt() != null) {
            throw new IllegalArgumentException("Bu oturumun saat aktarımı zaten yapıldı");
        }
        Instant now = Instant.now();
        Instant start = ex.getScheduledStartAt();
        if (start == null || now.isBefore(start)) {
            throw new IllegalArgumentException("Sorun bildirimi yalnızca ders başladıktan sonra yapılabilir");
        }
        String message = req.getMessage() == null ? "" : req.getMessage().trim();
        if (message.isEmpty()) {
            throw new IllegalArgumentException("Lütfen bir açıklama yazın");
        }
        User actor = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new BadCredentialsException("Kullanıcı bulunamadı"));

        int elapsed = computeElapsedSessionMinutes(start, now, ex.getBookedMinutes());
        ex.setSessionStoppedAt(now);
        ex.setSessionStopReason(message);
        ex.setSessionStoppedBy(actor);
        settleSessionCredits(ex, elapsed, "Oturum sorun bildirimi — kısmi aktarım");
        ex.setStatus(ExchangeRequestStatus.COMPLETED);
        exchangeRequestRepository.save(ex);

        ExchangeMessage messageEntity = new ExchangeMessage();
        messageEntity.setExchangeRequest(ex);
        messageEntity.setSender(actor);
        messageEntity.setBody("[Sorun bildirimi] " + message);
        exchangeMessageRepository.save(messageEntity);

        notificationService.notifySessionStoppedPartial(ex, userEmail, elapsed, message);
        return mapToResponse(ex, now);
    }

    /**
     * Zamanlayıcı: (1) iki tarafın seans öncesi onayladığı ve süresi dolan oturumlarda tam aktarım,
     * (2) hiç onaylanmamış ve bitişinin üzerinden {@link #UNCONFIRMED_SESSION_GRACE_HOURS} saat geçmiş
     * oturumlarda öğrenciye tam iade. Her kayıt kendi transaction'ında işlenir; biri hata verirse
     * diğerleri etkilenmez (önceden tek transaction + yutulan hata tüm toplu işlemi geri alabiliyordu).
     */
    public void settleDueSessionsAtEnd() {
        for (UUID id : exchangeRequestRepository.findPendingSessionCreditSettlement(ExchangeRequestStatus.ACCEPTED)) {
            runPerRecord(id, "tam aktarım", () -> settleConfirmedSessionIfEnded(id));
        }
        Instant startedBefore = Instant.now();
        for (UUID id : exchangeRequestRepository.findUnsettledAcceptedStartedBefore(
                ExchangeRequestStatus.ACCEPTED, startedBefore)) {
            runPerRecord(id, "onaysız kapanış", () -> refundUnconfirmedSessionIfExpired(id));
        }
    }

    private void runPerRecord(UUID id, String label, Runnable work) {
        try {
            perRecordTx.executeWithoutResult(status -> work.run());
        } catch (Exception e) {
            log.warn("Oturum kapanışı ({}) başarısız: exchange={} — {}", label, id, e.getMessage());
        }
    }

    private void settleConfirmedSessionIfEnded(UUID id) {
        ExchangeRequest ex = exchangeRequestRepository.findByIdForUpdate(id).orElse(null);
        if (ex == null || ex.getStatus() != ExchangeRequestStatus.ACCEPTED
                || ex.getCreditsSettledAt() != null || ex.getPreSessionBothConfirmedAt() == null
                || ex.getScheduledStartAt() == null) {
            return;
        }
        Instant end = ex.getScheduledStartAt().plus(ex.getBookedMinutes(), ChronoUnit.MINUTES);
        if (Instant.now().isBefore(end)) {
            return;
        }
        settleSessionCredits(ex, ex.getBookedMinutes(), "Oturum süresi tamamlandı");
        ex.setStatus(ExchangeRequestStatus.COMPLETED);
        exchangeRequestRepository.save(ex);
        notificationService.notifySessionFullSettlement(ex);
    }

    /**
     * No-show / onaysız oturum: iki taraf seans öncesi onay vermedi, katılım da iki taraflı onaylanmadı.
     * Bitişten {@link #UNCONFIRMED_SESSION_GRACE_HOURS} saat sonra askıdaki saat öğrenciye tam iade edilir.
     * Bu süre içinde iki taraf "seans başladı" onayı verirse normal tam aktarım yapılır.
     */
    private void refundUnconfirmedSessionIfExpired(UUID id) {
        ExchangeRequest ex = exchangeRequestRepository.findByIdForUpdate(id).orElse(null);
        if (ex == null || ex.getStatus() != ExchangeRequestStatus.ACCEPTED || ex.isInquiryOnly()
                || ex.getCreditsSettledAt() != null || ex.getPreSessionBothConfirmedAt() != null
                || ex.getScheduledStartAt() == null) {
            return;
        }
        Instant deadline = ex.getScheduledStartAt()
                .plus(ex.getBookedMinutes(), ChronoUnit.MINUTES)
                .plus(UNCONFIRMED_SESSION_GRACE_HOURS, ChronoUnit.HOURS);
        if (Instant.now().isBefore(deadline)) {
            return;
        }
        markCancelled(ex);
        ex.setSessionStopReason("Otomatik kapanış: katılım onaylanmadı — tam iade");
        exchangeRequestRepository.save(ex);
        notificationService.notifyUnconfirmedSessionRefunded(ex);
    }

    /**
     * Oturum öncesi katılım: CONFIRM veya DECLINE (DECLINE anında iptal değil; çift red / çelişki iptali ayrı).
     */
    @Transactional
    public ExchangeRequestResponse submitPreSessionResponse(UUID requestId, String userEmail, String decisionRaw) {
        String decision = decisionRaw == null ? "" : decisionRaw.trim().toUpperCase(Locale.ROOT);
        if (!"CONFIRM".equals(decision) && !"DECLINE".equals(decision)) {
            throw new IllegalArgumentException("Geçersiz karar");
        }
        ExchangeRequest ex = exchangeRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadı"));
        Instant now = Instant.now();
        if (!canRespondPreSession(ex, now)) {
            throw new IllegalArgumentException(
                    "Bu oturum için seans onayı penceresi dışında yanıt veremezsiniz");
        }
        if (ex.getStatus() != ExchangeRequestStatus.ACCEPTED) {
            throw new IllegalArgumentException("Sadece onaylanmış oturumlar için geçerlidir");
        }
        boolean isRequester = ex.getRequester().getEmail().equalsIgnoreCase(userEmail);
        boolean isOwner = ex.getSkill().getOwner().getEmail().equalsIgnoreCase(userEmail);
        if (!isRequester && !isOwner) {
            throw new IllegalArgumentException("Bu oturumda değilsiniz");
        }

        if ("DECLINE".equals(decision)) {
            if (isRequester) {
                if ("DECLINED".equalsIgnoreCase(ex.getRequesterPreSessionResponse())) {
                    return mapToResponse(ex);
                }
                ex.setRequesterPreSessionResponse("DECLINED");
            } else {
                if ("DECLINED".equalsIgnoreCase(ex.getOwnerPreSessionResponse())) {
                    return mapToResponse(ex);
                }
                ex.setOwnerPreSessionResponse("DECLINED");
            }
            exchangeRequestRepository.save(ex);
            applyPreSessionDeclineResolution(ex, userEmail);
            return mapToResponse(ex);
        }

        if (isRequester) {
            if ("CONFIRMED".equalsIgnoreCase(ex.getRequesterPreSessionResponse())) {
                return mapToResponse(ex);
            }
            ex.setRequesterPreSessionResponse("CONFIRMED");
        } else {
            if ("CONFIRMED".equalsIgnoreCase(ex.getOwnerPreSessionResponse())) {
                return mapToResponse(ex);
            }
            ex.setOwnerPreSessionResponse("CONFIRMED");
        }
        exchangeRequestRepository.save(ex);
        applyPreSessionConfirmResolution(ex, userEmail);
        return mapToResponse(ex);
    }

    private void applyPreSessionDeclineResolution(ExchangeRequest ex, String actorEmail) {
        String rq = ex.getRequesterPreSessionResponse();
        String ow = ex.getOwnerPreSessionResponse();
        boolean rDec = "DECLINED".equalsIgnoreCase(rq);
        boolean oDec = "DECLINED".equalsIgnoreCase(ow);
        boolean rConf = "CONFIRMED".equalsIgnoreCase(rq);
        boolean oConf = "CONFIRMED".equalsIgnoreCase(ow);

        if (rDec && oDec) {
            cancelAcceptedExchangeAfterPreSession(ex);
            notificationService.notifyPreSessionBothDeclined(ex);
            return;
        }
        if ((rDec && oConf) || (oDec && rConf)) {
            cancelAcceptedExchangeAfterPreSession(ex);
            notificationService.notifyPreSessionCancelledIncompatible(ex);
            return;
        }
        if (rDec || oDec) {
            notificationService.notifyPreSessionPeerDeclined(ex, actorEmail);
        }
    }

    private void applyPreSessionConfirmResolution(ExchangeRequest ex, String actorEmail) {
        String rq = ex.getRequesterPreSessionResponse();
        String ow = ex.getOwnerPreSessionResponse();
        if (!"CONFIRMED".equalsIgnoreCase(rq) || !"CONFIRMED".equalsIgnoreCase(ow)) {
            notificationService.notifyPreSessionPartnerConfirmed(ex, actorEmail);
            return;
        }
        if (ex.getPreSessionBothConfirmedAt() != null) {
            return;
        }
        ex.setPreSessionBothConfirmedAt(Instant.now());
        exchangeRequestRepository.save(ex);
        notificationService.notifyPreSessionBothReady(ex);
    }

    /**
     * Kısmi veya tam aktarım: eğitmene {@code minutesToTransfer}, kalan askı öğrenciye iade.
     */
    private void settleSessionCredits(ExchangeRequest ex, int minutesToTransfer, String ledgerNote) {
        if (ex.getCreditsSettledAt() != null) {
            return;
        }
        int booked = ex.getBookedMinutes();
        if (!ex.isRequesterCreditHeld()) {
            // Askıda kredi yoksa aktarılacak kaynak da yok: eğitmene yoktan dakika yaratılmaz.
            log.warn("Askıda kredi olmadan kapanış: exchange={} — aktarım yapılmadı", ex.getId());
            minutesToTransfer = 0;
        }
        int transfer = Math.min(Math.max(0, minutesToTransfer), booked);
        int refund = booked - transfer;

        User provider = ex.getSkill().getOwner();
        User requester = ex.getRequester();

        if (transfer > 0) {
            userRepository.credit(provider.getId(), transfer);
            TimeTransaction earnTx = new TimeTransaction();
            earnTx.setUser(provider);
            earnTx.setExchangeRequest(ex);
            earnTx.setType(TransactionType.EARN);
            earnTx.setMinutes(transfer);
            earnTx.setDescription(ledgerNote);
            timeTransactionRepository.save(earnTx);
        }

        if (refund > 0 && ex.isRequesterCreditHeld()) {
            userRepository.credit(requester.getId(), refund);
        }

        if (transfer > 0) {
            TimeTransaction spendTx = new TimeTransaction();
            spendTx.setUser(requester);
            spendTx.setExchangeRequest(ex);
            spendTx.setType(TransactionType.SPEND);
            spendTx.setMinutes(transfer);
            spendTx.setDescription(ledgerNote);
            timeTransactionRepository.save(spendTx);
        }

        ex.setRequesterCreditHeld(false);
        ex.setSettledMinutes(transfer);
        ex.setCreditsSettledAt(Instant.now());
        exchangeRequestRepository.save(ex);
    }

    private static int computeElapsedSessionMinutes(Instant start, Instant now, int bookedMinutes) {
        long raw = ChronoUnit.MINUTES.between(start, now);
        if (raw < 1) {
            raw = 1;
        }
        return (int) Math.min(raw, bookedMinutes);
    }

    private void cancelAcceptedExchangeAfterPreSession(ExchangeRequest ex) {
        if (ex.getStatus() != ExchangeRequestStatus.ACCEPTED) {
            return;
        }
        markCancelled(ex);
        exchangeRequestRepository.save(ex);
    }

    private void markCancelled(ExchangeRequest ex) {
        ex.setStatus(ExchangeRequestStatus.CANCELLED);
        if (ex.getCancelledAt() == null) {
            ex.setCancelledAt(Instant.now());
        }
        releaseHeldCreditIfAny(ex);
    }

    @Transactional(readOnly = true)
    public List<PendingCancelSurveyDockResponse> listPendingCancelSurveysForDock(String userEmail) {
        String email = userEmail == null ? "" : userEmail.trim();
        if (email.isEmpty()) {
            return List.of();
        }
        User me = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("Kullanıcı bulunamadı"));

        Instant since = Instant.now().minus(14, ChronoUnit.DAYS);
        Map<UUID, PendingCancelSurveyDockResponse> out = new LinkedHashMap<>();

        for (ExchangeRequest ex : exchangeRequestRepository.findByRequesterEmailOrderByCreatedAtDesc(email)) {
            addPendingCancelSurveyIfNeeded(out, ex, me, since);
        }
        for (ExchangeRequest ex : exchangeRequestRepository.findBySkillOwnerEmailOrderByCreatedAtDesc(email)) {
            addPendingCancelSurveyIfNeeded(out, ex, me, since);
        }

        return out.values().stream()
                .sorted(Comparator.comparing(PendingCancelSurveyDockResponse::getCancelledAt).reversed())
                .toList();
    }

    @Transactional
    public void submitCancelSurvey(UUID exchangeId, CancelSurveyRequest req, String userEmail) {
        User me = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new BadCredentialsException("Kullanıcı bulunamadı"));
        ExchangeRequest ex = exchangeRequestRepository.findById(exchangeId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadı"));
        if (!isParticipant(ex, userEmail)) {
            throw new IllegalArgumentException("Bu oturumda değilsiniz");
        }
        if (!isEligibleForCancelSurvey(ex)) {
            throw new IllegalArgumentException("Bu iptal için anket gönderilemez");
        }
        String code = req.getReasonCode() == null ? "" : req.getReasonCode().trim().toUpperCase(Locale.ROOT);
        if (!CANCEL_SURVEY_REASONS.contains(code)) {
            throw new IllegalArgumentException("Geçersiz iptal nedeni");
        }
        if (exchangeCancelSurveyRepository.existsByExchangeRequest_IdAndRespondent_Id(exchangeId, me.getId())) {
            throw new IllegalArgumentException("Bu iptal için zaten yanıt verdiniz");
        }
        ExchangeCancelSurvey survey = new ExchangeCancelSurvey();
        survey.setExchangeRequest(ex);
        survey.setRespondent(me);
        survey.setReasonCode(code);
        String note = req.getNote() == null ? null : req.getNote().trim();
        survey.setNote(note == null || note.isEmpty() ? null : note);
        exchangeCancelSurveyRepository.save(survey);
    }

    private void addPendingCancelSurveyIfNeeded(
            Map<UUID, PendingCancelSurveyDockResponse> out,
            ExchangeRequest ex,
            User me,
            Instant since
    ) {
        if (!isEligibleForCancelSurvey(ex)) {
            return;
        }
        if (exchangeCancelSurveyRepository.existsByExchangeRequest_IdAndRespondent_Id(ex.getId(), me.getId())) {
            return;
        }
        Instant cancelled = ex.getCancelledAt();
        if (cancelled == null || cancelled.isBefore(since)) {
            return;
        }
        out.put(
                ex.getId(),
                new PendingCancelSurveyDockResponse(
                        ex.getId(),
                        ex.getSkill().getTitle(),
                        cancelled
                )
        );
    }

    private static boolean isEligibleForCancelSurvey(ExchangeRequest ex) {
        if (ex.isInquiryOnly() || ex.getStatus() != ExchangeRequestStatus.CANCELLED) {
            return false;
        }
        if (ex.getCreditsSettledAt() != null) {
            return false;
        }
        return ex.isPreSessionConfirmSent()
                || ex.getRequesterPreSessionResponse() != null
                || ex.getOwnerPreSessionResponse() != null;
    }

    /** Kart: dersden 10 dk önce → ders bitene kadar (saat kesinleşene kadar). */
    private boolean shouldShowInSessionDock(ExchangeRequest ex, Instant now) {
        if (ex.getStatus() != ExchangeRequestStatus.ACCEPTED || ex.isInquiryOnly()) {
            return false;
        }
        if (ex.getScheduledStartAt() == null || ex.getCreditsSettledAt() != null) {
            return false;
        }
        Instant start = ex.getScheduledStartAt();
        Instant end = start.plus(ex.getBookedMinutes(), ChronoUnit.MINUTES);
        Instant dockOpens = start.minus(10, ChronoUnit.MINUTES);
        if (now.isAfter(end)) {
            return false;
        }
        if (preSessionDemo) {
            return ex.isPreSessionConfirmSent() || ex.getPreSessionBothConfirmedAt() != null;
        }
        // Zamana dayalı: bildirim zamanlayıcısı (ör. Render uykusu) penceresini kaçırsa bile kart açılır.
        return !now.isBefore(dockOpens);
    }

    private boolean canRespondPreSession(ExchangeRequest ex, Instant now) {
        if (!shouldShowInSessionDock(ex, now)) {
            return false;
        }
        if (ex.getScheduledStartAt() == null || !now.isBefore(ex.getScheduledStartAt())) {
            return false;
        }
        return isPreSessionExchangeStillOpen(ex);
    }

    /** Seans öncesi kabul/red penceresi (ders başlamadan önce). */
    private boolean isPreSessionExchangeStillOpen(ExchangeRequest ex) {
        if (ex.getStatus() != ExchangeRequestStatus.ACCEPTED) {
            return false;
        }
        if (ex.getPreSessionBothConfirmedAt() != null) {
            return false;
        }
        String rq = ex.getRequesterPreSessionResponse();
        String ow = ex.getOwnerPreSessionResponse();
        boolean rDec = "DECLINED".equalsIgnoreCase(rq);
        boolean oDec = "DECLINED".equalsIgnoreCase(ow);
        boolean rConf = "CONFIRMED".equalsIgnoreCase(rq);
        boolean oConf = "CONFIRMED".equalsIgnoreCase(ow);
        if (rDec && oDec) {
            return false;
        }
        if ((rDec && oConf) || (oDec && rConf)) {
            return false;
        }
        return true;
    }

    private static String resolveSessionDockPhase(
            ExchangeRequest ex,
            Instant now,
            Instant start,
            Instant end
    ) {
        if (ex.getCreditsSettledAt() != null) {
            return "DONE";
        }
        if (start == null) {
            return "PRE_CONFIRM";
        }
        if (now.isBefore(start)) {
            return ex.getPreSessionBothConfirmedAt() != null ? "WAITING_START" : "PRE_CONFIRM";
        }
        if (end != null && !now.isAfter(end)) {
            return "LIVE";
        }
        return "ENDED";
    }

    private static boolean stillWithinSessionWindowForPreSessionUi(ExchangeRequest ex, Instant now) {
        if (ex.getScheduledStartAt() == null) {
            return false;
        }
        Instant end = ex.getScheduledStartAt().plus(ex.getBookedMinutes(), ChronoUnit.MINUTES);
        return !now.isAfter(end);
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
            if (!ex.isInquiryOnly()) {
                throw new IllegalArgumentException("Talep beklemedeyken mesaj gönderilemez");
            }
        }
        if (!isParticipant(ex, userEmail)) {
            throw new IllegalArgumentException("Bu konuşmaya erişim yok");
        }
        User sender = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new BadCredentialsException("Kullanıcı bulunamadı"));
        User otherUser = ex.getRequester().getId().equals(sender.getId())
                ? ex.getSkill().getOwner()
                : ex.getRequester();
        if (userBlockRepository.existsByBlocker_IdAndBlocked_Id(otherUser.getId(), sender.getId())) {
            throw new IllegalArgumentException("Bu kullanıcı sizi engelledi. Mesaj gönderemezsiniz");
        }
        ExchangeMessage msg = new ExchangeMessage();
        msg.setExchangeRequest(ex);
        msg.setSender(sender);
        msg.setBody(req.getBody().trim());
        ExchangeMessage saved = exchangeMessageRepository.save(msg);
        notificationService.notifyNewExchangeMessage(ex, sender);
        return mapMessage(saved);
    }

    private static boolean isParticipant(ExchangeRequest ex, String email) {
        return ex.getRequester().getEmail().equalsIgnoreCase(email)
                || ex.getSkill().getOwner().getEmail().equalsIgnoreCase(email);
    }

    /**
     * Aynı kullanıcı için aynı anda (öğrenci veya eğitmen olarak) çakışan onaylı oturum yok.
     */
    private void assertNoAcceptScheduleConflict(
            User requester,
            User owner,
            Instant scheduled,
            int bookedMinutes,
            UUID excludeExchangeId
    ) {
        if (scheduled == null) {
            return;
        }
        if (bookedMinutes <= 0) {
            return;
        }
        assertUserScheduleNoOverlap(requester.getId(), scheduled, bookedMinutes, excludeExchangeId);
        assertUserScheduleNoOverlap(owner.getId(), scheduled, bookedMinutes, excludeExchangeId);
    }

    private void assertUserScheduleNoOverlap(
            UUID userId,
            Instant newStart,
            int newMinutes,
            UUID excludeExchangeId
    ) {
        Instant newEnd = newStart.plus(newMinutes, ChronoUnit.MINUTES);
        List<ExchangeRequest> list = exchangeRequestRepository.findAcceptedByUserInvolvement(
                ExchangeRequestStatus.ACCEPTED, userId);
        for (ExchangeRequest e : list) {
            if (excludeExchangeId != null && excludeExchangeId.equals(e.getId())) {
                continue;
            }
            Instant oStart = e.getScheduledStartAt();
            if (oStart == null) {
                continue;
            }
            Instant oEnd = oStart.plus(e.getBookedMinutes(), ChronoUnit.MINUTES);
            if (intervalsOverlap(newStart, newEnd, oStart, oEnd)) {
                throw new IllegalArgumentException(
                        "Bu zaman aralığında zaten onaylanmış başka bir oturumunuz var; çakışan rezervasyon yapılamaz.");
            }
        }
    }

    private static boolean intervalsOverlap(Instant a0, Instant a1, Instant b0, Instant b1) {
        // Yarım açık: [a0, a1) yorumu — aynı anda biten/başlayan hafif kesişimlere izin: bitiş == başlangıç çakışmaz
        return a0.isBefore(b1) && b0.isBefore(a1);
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
        return mapToResponse(exchangeRequest, Instant.now());
    }

    private ExchangeRequestResponse mapToResponse(ExchangeRequest exchangeRequest, Instant now) {
        Instant start = exchangeRequest.getScheduledStartAt();
        Instant end = start == null
                ? null
                : start.plus(exchangeRequest.getBookedMinutes(), ChronoUnit.MINUTES);
        String phase = resolveSessionDockPhase(exchangeRequest, now, start, end);
        return new ExchangeRequestResponse(
                exchangeRequest.getId(),
                exchangeRequest.getSkill().getId(),
                exchangeRequest.getSkill().getTitle(),
                exchangeRequest.getRequester().getId(),
                exchangeRequest.getRequester().getFullName(),
                exchangeRequest.getRequester().getEmail(),
                exchangeRequest.getSkill().getOwner().getId(),
                exchangeRequest.getSkill().getOwner().getFullName(),
                exchangeRequest.getSkill().getOwner().getEmail(),
                exchangeRequest.getMessage(),
                exchangeRequest.getBookedMinutes(),
                start,
                exchangeRequest.isPendingFromOwner(),
                exchangeRequest.getStatus(),
                exchangeRequest.getCreatedAt(),
                exchangeRequest.getSessionMeetingUrl(),
                exchangeRequest.getRequesterAttendanceAckAt(),
                exchangeRequest.getOwnerAttendanceAckAt(),
                exchangeRequest.isInquiryOnly(),
                exchangeRequest.isPreSessionConfirmSent(),
                exchangeRequest.getRequesterPreSessionResponse(),
                exchangeRequest.getOwnerPreSessionResponse(),
                exchangeRequest.getPreSessionBothConfirmedAt(),
                phase,
                end,
                exchangeRequest.getCreditsSettledAt(),
                exchangeRequest.getSettledMinutes(),
                exchangeRequest.getSessionStoppedAt(),
                exchangeRequest.getSessionStopReason()
        );
    }

    private void releaseHeldCreditIfAny(ExchangeRequest ex) {
        if (!ex.isRequesterCreditHeld()) {
            return;
        }
        userRepository.credit(ex.getRequester().getId(), ex.getBookedMinutes());
        ex.setRequesterCreditHeld(false);
    }

    /** Katılım/tamamlama onayı yalnızca planlanan başlangıçtan sonra (erken tam aktarımı önler). */
    private static void assertSessionStarted(ExchangeRequest ex) {
        Instant start = ex.getScheduledStartAt();
        if (start != null && Instant.now().isBefore(start)) {
            throw new IllegalArgumentException(
                    "Seans henüz başlamadı; katılım onayı başlangıç saatinden sonra verilebilir");
        }
    }

    private void lockParticipants(User a, User b) {
        UUID first = a.getId().compareTo(b.getId()) <= 0 ? a.getId() : b.getId();
        UUID second = first.equals(a.getId()) ? b.getId() : a.getId();
        userRepository.findByIdForUpdate(first);
        if (!second.equals(first)) {
            userRepository.findByIdForUpdate(second);
        }
    }

    private void settleIfBothAttendanceAcked(ExchangeRequest exchangeRequest) {
        if (exchangeRequest.getStatus() != ExchangeRequestStatus.ACCEPTED) {
            return;
        }
        if (exchangeRequest.getRequesterAttendanceAckAt() == null || exchangeRequest.getOwnerAttendanceAckAt() == null) {
            return;
        }
        if (exchangeRequest.getCreditsSettledAt() != null) {
            exchangeRequest.setStatus(ExchangeRequestStatus.COMPLETED);
            exchangeRequestRepository.save(exchangeRequest);
            return;
        }
        settleSessionCredits(exchangeRequest, exchangeRequest.getBookedMinutes(), "Katılım onayı — tam aktarım");
        exchangeRequest.setStatus(ExchangeRequestStatus.COMPLETED);
        exchangeRequestRepository.save(exchangeRequest);
    }
}