package com.timebank.timebank.skill.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class SkillResponse {

    private UUID id;
    private String title;
    private String description;
    private int durationMinutes;
    private String category;
    private String level;
    private List<String> sessionTypes;
    private String inPersonLocation;
    private List<String> availableDays;
    private String availableFrom;
    private String availableUntil;
    private UUID ownerId;
    private String ownerName;
    private Instant createdAt;
    private String coverImageUrl;

    public SkillResponse(
            UUID id,
            String title,
            String description,
            int durationMinutes,
            String category,
            String level,
            List<String> sessionTypes,
            String inPersonLocation,
            List<String> availableDays,
            String availableFrom,
            String availableUntil,
            UUID ownerId,
            String ownerName,
            Instant createdAt,
            String coverImageUrl
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.durationMinutes = durationMinutes;
        this.category = category;
        this.level = level;
        this.sessionTypes = sessionTypes;
        this.inPersonLocation = inPersonLocation;
        this.availableDays = availableDays;
        this.availableFrom = availableFrom;
        this.availableUntil = availableUntil;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.createdAt = createdAt;
        this.coverImageUrl = coverImageUrl;
    }

    public UUID getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public String getCategory() {
        return category;
    }

    public String getLevel() {
        return level;
    }

    public List<String> getSessionTypes() {
        return sessionTypes;
    }

    public String getInPersonLocation() {
        return inPersonLocation;
    }

    public List<String> getAvailableDays() {
        return availableDays;
    }

    public String getAvailableFrom() {
        return availableFrom;
    }

    public String getAvailableUntil() {
        return availableUntil;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public String getCoverImageUrl() {
        return coverImageUrl;
    }
}
