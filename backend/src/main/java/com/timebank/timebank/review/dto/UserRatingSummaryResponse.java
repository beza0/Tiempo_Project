package com.timebank.timebank.review.dto;

public class UserRatingSummaryResponse {

    private long totalReviews;
    private double averageRating;

    public UserRatingSummaryResponse(long totalReviews, double averageRating) {
        this.totalReviews = totalReviews;
        this.averageRating = averageRating;
    }

    public long getTotalReviews() {
        return totalReviews;
    }

    public double getAverageRating() {
        return averageRating;
    }
}