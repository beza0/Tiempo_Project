package com.timebank.timebank.transaction.dto;

import com.timebank.timebank.transaction.TransactionType;

import java.time.Instant;
import java.util.UUID;

public class TimeTransactionResponse {

    private UUID id;
    private TransactionType type;
    private int minutes;
    private String description;
    private UUID exchangeRequestId;
    private Instant createdAt;

    public TimeTransactionResponse(
            UUID id,
            TransactionType type,
            int minutes,
            String description,
            UUID exchangeRequestId,
            Instant createdAt
    ) {
        this.id = id;
        this.type = type;
        this.minutes = minutes;
        this.description = description;
        this.exchangeRequestId = exchangeRequestId;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public TransactionType getType() {
        return type;
    }

    public int getMinutes() {
        return minutes;
    }

    public String getDescription() {
        return description;
    }

    public UUID getExchangeRequestId() {
        return exchangeRequestId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}