package com.timebank.timebank.review;

import com.timebank.timebank.review.dto.CreateReviewRequest;
import com.timebank.timebank.review.dto.ReviewResponse;
import com.timebank.timebank.review.dto.UserRatingSummaryResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/exchange/{exchangeRequestId}")
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable java.util.UUID exchangeRequestId,
            @Valid @RequestBody CreateReviewRequest req,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                reviewService.createReview(exchangeRequestId, req, authentication.getName())
        );
    }

    @GetMapping("/me/received")
    public ResponseEntity<List<ReviewResponse>> getMyReceivedReviews(Authentication authentication) {
        return ResponseEntity.ok(
                reviewService.getReviewsForUser(authentication.getName())
        );
    }

    @GetMapping("/me/summary")
    public ResponseEntity<UserRatingSummaryResponse> getMyRatingSummary(Authentication authentication) {
        return ResponseEntity.ok(
                reviewService.getRatingSummary(authentication.getName())
        );
    }

    /** Benim yazdığım yorumlar (aldığım derslerde eğitmeni değerlendirme) */
    @GetMapping("/me/given")
    public ResponseEntity<List<ReviewResponse>> getMyWrittenReviews(Authentication authentication) {
        return ResponseEntity.ok(
                reviewService.getReviewsWrittenByUser(authentication.getName())
        );
    }

    @GetMapping("/me/given/summary")
    public ResponseEntity<UserRatingSummaryResponse> getMyGivenReviewsSummary(Authentication authentication) {
        return ResponseEntity.ok(
                reviewService.getRatingSummaryForReviewsGiven(authentication.getName())
        );
    }
}