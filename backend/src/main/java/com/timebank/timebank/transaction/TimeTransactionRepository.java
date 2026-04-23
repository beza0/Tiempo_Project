package com.timebank.timebank.transaction;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TimeTransactionRepository extends JpaRepository<TimeTransaction, UUID> {

    @EntityGraph(attributePaths = {"exchangeRequest", "exchangeRequest.skill"})
    List<TimeTransaction> findByUserEmailOrderByCreatedAtDesc(String email);
}