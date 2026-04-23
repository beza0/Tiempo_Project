package com.timebank.timebank.review;

import com.timebank.timebank.exchange.ExchangeRequest;
import com.timebank.timebank.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reviews", uniqueConstraints = {
        @UniqueConstraint(columnNames = "exchange_request_id")
})
public class Review {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "exchange_request_id", nullable = false, unique = true)
    private ExchangeRequest exchangeRequest;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_user_id", nullable = false)
    private User reviewedUser;

    @Column(nullable = false)
    private int rating;

    @Column(length = 1000)
    private String comment;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public ExchangeRequest getExchangeRequest() {
        return exchangeRequest;
    }

    public User getReviewer() {
        return reviewer;
    }

    public User getReviewedUser() {
        return reviewedUser;
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

    public void setId(UUID id) {
        this.id = id;
    }

    public void setExchangeRequest(ExchangeRequest exchangeRequest) {
        this.exchangeRequest = exchangeRequest;
    }

    public void setReviewer(User reviewer) {
        this.reviewer = reviewer;
    }

    public void setReviewedUser(User reviewedUser) {
        this.reviewedUser = reviewedUser;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}