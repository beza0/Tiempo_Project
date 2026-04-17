package com.timebank.timebank.notification.dto;

import java.time.Instant;
import java.util.UUID;

public class NotificationResponse {

    private UUID id;
    private String title;
    private String body;
    private Instant createdAt;
    private Instant readAt;
    private UUID exchangeRequestId;
    private String skillTitle;

    public NotificationResponse(
            UUID id,
            String title,
            String body,
            Instant createdAt,
            Instant readAt,
            UUID exchangeRequestId,
            String skillTitle
    ) {
        this.id = id;
        this.title = title;
        this.body = body;
        this.createdAt = createdAt;
        this.readAt = readAt;
        this.exchangeRequestId = exchangeRequestId;
        this.skillTitle = skillTitle;
    }

    public UUID getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getBody() {
        return body;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public UUID getExchangeRequestId() {
        return exchangeRequestId;
    }

    public String getSkillTitle() {
        return skillTitle;
    }
}
