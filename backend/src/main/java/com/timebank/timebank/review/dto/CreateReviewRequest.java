package com.timebank.timebank.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public class CreateReviewRequest {

    @Min(value = 1, message = "Puan en az 1 olmalı")
    @Max(value = 5, message = "Puan en fazla 5 olmalı")
    private int rating;

    @Size(max = 1000, message = "Yorum en fazla 1000 karakter olabilir")
    private String comment;

    public int getRating() {
        return rating;
    }

    public String getComment() {
        return comment;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}