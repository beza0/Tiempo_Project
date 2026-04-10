package com.timebank.timebank.exchange;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ExchangeMessageRepository extends JpaRepository<ExchangeMessage, UUID> {

    @EntityGraph(attributePaths = "sender")
    List<ExchangeMessage> findByExchangeRequest_IdOrderByCreatedAtAsc(UUID exchangeRequestId);
}
