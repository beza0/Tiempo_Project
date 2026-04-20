package com.timebank.timebank.transaction;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface TimeTransactionRepository extends JpaRepository<TimeTransaction, UUID> {

    void deleteAllByUser_Id(UUID userId);

    void deleteAllByExchangeRequest_IdIn(Collection<UUID> exchangeRequestIds);

    @EntityGraph(attributePaths = {"exchangeRequest", "exchangeRequest.skill"})
    List<TimeTransaction> findByUserEmailOrderByCreatedAtDesc(String email);
}