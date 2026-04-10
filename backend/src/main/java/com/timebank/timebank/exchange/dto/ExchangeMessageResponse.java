package com.timebank.timebank.exchange.dto;

import java.time.Instant;
import java.util.UUID;

public class ExchangeMessageResponse {

    private UUID id;
    private UUID senderId;
    private String senderName;
    private String body;
    private Instant createdAt;

    public ExchangeMessageResponse(
            UUID id,
            UUID senderId,
            String senderName,
            String body,
            Instant createdAt
    ) {
        this.id = id;
        this.senderId = senderId;
        this.senderName = senderName;
        this.body = body;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getSenderId() {
        return senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public String getBody() {
        return body;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
