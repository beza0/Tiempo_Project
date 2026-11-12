package com.timebank.timebank.review;

import com.timebank.timebank.exchange.ExchangeRequest;
import com.timebank.timebank.exchange.ExchangeRequestRepository;
import com.timebank.timebank.exchange.ExchangeRequestStatus;
import com.timebank.timebank.review.dto.CreateReviewRequest;
import com.timebank.timebank.review.dto.PendingReviewDockResponse;
import com.timebank.timebank.review.dto.ReviewResponse;
import com.timebank.timebank.review.dto.UserRatingSummaryResponse;
import com.timebank.timebank.user.User;
import com.timebank.timebank.user.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ExchangeRequestRepository exchangeRequestRepository;
    private final UserRepository userRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            ExchangeRequestRepository exchangeRequestRepository,
            UserRepository userRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.exchangeRequestRepository = exchangeRequestRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ReviewResponse createReview(UUID exchangeRequestId, CreateReviewRequest req, String reviewerEmail) {
        User reviewer = userRepository.findByEmailIgnoreCase(reviewerEmail)
                .orElseThrow(() -> new BadCredentialsException("Kullanıcı bulunamadı"));

        ExchangeRequest exchangeRequest = exchangeRequestRepository.findById(exchangeRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Exchange request bulunamadı"));

        if (!isEligibleForReview(exchangeRequest)) {
            throw new IllegalArgumentException("Bu oturum için değerlendirme yapılamaz");
        }

        boolean isRequester = exchangeRequest.getRequester().getEmail().equalsIgnoreCase(reviewerEmail);
        boolean isOwner = exchangeRequest.getSkill().getOwner().getEmail().equalsIgnoreCase(reviewerEmail);
        if (!isRequester && !isOwner) {
            throw new IllegalArgumentException("Bu oturumda değilsiniz");
        }

        if (reviewRepository.existsByExchangeRequest_IdAndReviewer_Id(exchangeRequestId, reviewer.getId())) {
            throw new IllegalArgumentException("Bu oturum için zaten değerlendirme yaptınız");
        }

        User reviewedUser = isRequester
                ? exchangeRequest.getSkill().getOwner()
                : exchangeRequest.getRequester();

        Review review = new Review();
        review.setExchangeRequest(exchangeRequest);
        review.setReviewer(reviewer);
        review.setReviewedUser(reviewedUser);
        review.setRating(req.getRating());
        review.setComment(req.getComment() != null ? req.getComment().trim() : null);

        Review saved = reviewRepository.save(review);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PendingReviewDockResponse> listPendingReviewsForDock(String userEmail) {
        String email = userEmail == null ? "" : userEmail.trim();
        if (email.isEmpty()) {
            return List.of();
        }
        User me = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("Kullanıcı bulunamadı"));

        List<ExchangeRequest> asRequester = exchangeRequestRepository
                .findByRequesterEmailOrderByCreatedAtDesc(email);
        List<ExchangeRequest> asOwner = exchangeRequestRepository
                .findBySkillOwnerEmailOrderByCreatedAtDesc(email);

        Map<UUID, PendingReviewDockResponse> out = new LinkedHashMap<>();
        for (ExchangeRequest ex : asRequester) {
            addPendingIfNeeded(out, ex, me, true);
        }
        for (ExchangeRequest ex : asOwner) {
            addPendingIfNeeded(out, ex, me, false);
        }

        return out.values().stream()
                .sorted(Comparator.comparing(PendingReviewDockResponse::getSessionEndedAt).reversed())
                .toList();
    }

    private void addPendingIfNeeded(
            Map<UUID, PendingReviewDockResponse> out,
            ExchangeRequest ex,
            User me,
            boolean iAmRequester
    ) {
        if (!isEligibleForReview(ex)) {
            return;
        }
        if (reviewRepository.existsByExchangeRequest_IdAndReviewer_Id(ex.getId(), me.getId())) {
            return;
        }
        Instant ended = sessionEndedAt(ex);
        if (ended == null || ended.isBefore(Instant.now().minus(14, ChronoUnit.DAYS))) {
            return;
        }
        User reviewed = iAmRequester ? ex.getSkill().getOwner() : ex.getRequester();
        String outcome = buildOutcomeLabel(ex);
        String uiMode = "COMPLETED".equals(outcome) ? "QUICK" : "DETAIL";
        out.put(
                ex.getId(),
                new PendingReviewDockResponse(
                        ex.getId(),
                        ex.getSkill().getTitle(),
                        reviewed.getId(),
                        reviewed.getFullName(),
                        ex.getStatus(),
                        ex.getSettledMinutes(),
                        ex.getBookedMinutes(),
                        ended,
                        outcome,
                        uiMode
                )
        );
    }

    private static boolean isEligibleForReview(ExchangeRequest ex) {
        if (ex.isInquiryOnly()) {
            return false;
        }
        // Henüz başlamamış oturum değerlendirilemez (eski erken-aktarım kayıtları dahil).
        if (ex.getScheduledStartAt() != null && Instant.now().isBefore(ex.getScheduledStartAt())) {
            return false;
        }
        if (ex.getStatus() == ExchangeRequestStatus.COMPLETED) {
            return true;
        }
        if (ex.getStatus() == ExchangeRequestStatus.CANCELLED && ex.getCreditsSettledAt() != null) {
            return true;
        }
        return false;
    }

    private static Instant sessionEndedAt(ExchangeRequest ex) {
        if (ex.getCreditsSettledAt() != null) {
            return ex.getCreditsSettledAt();
        }
        if (ex.getSessionStoppedAt() != null) {
            return ex.getSessionStoppedAt();
        }
        if (ex.getStatus() == ExchangeRequestStatus.COMPLETED && ex.getScheduledStartAt() != null) {
            return ex.getScheduledStartAt().plus(ex.getBookedMinutes(), ChronoUnit.MINUTES);
        }
        return null;
    }

    private static String buildOutcomeLabel(ExchangeRequest ex) {
        if (ex.getStatus() == ExchangeRequestStatus.CANCELLED) {
            int settled = ex.getSettledMinutes() != null ? ex.getSettledMinutes() : 0;
            if (settled > 0) {
                return "PARTIAL";
            }
            return "CANCELLED";
        }
        return "COMPLETED";
    }

    public List<ReviewResponse> getReviewsForUser(String email) {
        return reviewRepository.findByReviewedUserEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public UserRatingSummaryResponse getRatingSummary(String email) {
        long totalReviews = reviewRepository.countByReviewedUserEmail(email);
        Double avg = reviewRepository.findAverageRatingByReviewedUserEmail(email);

        return new UserRatingSummaryResponse(
                totalReviews,
                avg != null ? avg : 0.0
        );
    }

    public List<ReviewResponse> getReviewsWrittenByUser(String reviewerEmail) {
        return reviewRepository.findByReviewer_EmailOrderByCreatedAtDesc(reviewerEmail)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public UserRatingSummaryResponse getRatingSummaryForReviewsGiven(String reviewerEmail) {
        long total = reviewRepository.countByReviewer_Email(reviewerEmail);
        Double avg = reviewRepository.findAverageRatingByReviewerEmail(reviewerEmail);
        return new UserRatingSummaryResponse(
                total,
                avg != null ? avg : 0.0
        );
    }

    private ReviewResponse mapToResponse(Review review) {
        String skillTitle = review.getExchangeRequest().getSkill() != null
                ? review.getExchangeRequest().getSkill().getTitle()
                : null;
        return new ReviewResponse(
                review.getId(),
                review.getExchangeRequest().getId(),
                review.getReviewer().getId(),
                review.getReviewer().getFullName(),
                review.getReviewedUser().getId(),
                review.getReviewedUser().getFullName(),
                skillTitle,
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
