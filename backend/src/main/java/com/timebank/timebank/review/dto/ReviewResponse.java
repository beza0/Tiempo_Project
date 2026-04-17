package com.timebank.timebank.review.dto;

import java.time.Instant;
import java.util.UUID;

public class ReviewResponse {

    private UUID id;
    private UUID exchangeRequestId;
    private UUID reviewerId;
    private String reviewerName;
    private UUID reviewedUserId;
    private String reviewedUserName;
    /** İlgili ders / beceri başlığı */
    private String skillTitle;
    private int rating;
    private String comment;
    private Instant createdAt;

    public ReviewResponse(
            UUID id,
            UUID exchangeRequestId,
            UUID reviewerId,
            String reviewerName,
            UUID reviewedUserId,
            String reviewedUserName,
            String skillTitle,
            int rating,
            String comment,
            Instant createdAt
    ) {
        this.id = id;
        this.exchangeRequestId = exchangeRequestId;
        this.reviewerId = reviewerId;
        this.reviewerName = reviewerName;
        this.reviewedUserId = reviewedUserId;
        this.reviewedUserName = reviewedUserName;
        this.skillTitle = skillTitle;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getExchangeRequestId() {
        return exchangeRequestId;
    }

    public UUID getReviewerId() {
        return reviewerId;
    }

    public String getReviewerName() {
        return reviewerName;
    }

    public UUID getReviewedUserId() {
        return reviewedUserId;
    }

    public String getReviewedUserName() {
        return reviewedUserName;
    }

    public String getSkillTitle() {
        return skillTitle;
    }

    public int getRating() {
        return rating;
    }

    public String getComment() {
        return comment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}