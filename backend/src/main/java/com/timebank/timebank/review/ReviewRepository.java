package com.timebank.timebank.review;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    boolean existsByExchangeRequestId(UUID exchangeRequestId);

    @EntityGraph(attributePaths = {"reviewer", "reviewedUser", "exchangeRequest"})
    List<Review> findByReviewedUserEmailOrderByCreatedAtDesc(String email);

    @EntityGraph(attributePaths = {"reviewer", "reviewedUser", "exchangeRequest"})
    Optional<Review> findById(UUID id);

    long countByReviewedUserEmail(String email);

    @Query("select avg(r.rating) from Review r where r.reviewedUser.email = :email")
    Double findAverageRatingByReviewedUserEmail(String email);
}