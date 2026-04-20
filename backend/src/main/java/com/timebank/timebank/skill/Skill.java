package com.timebank.timebank.skill;

import com.timebank.timebank.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "skills")
public class Skill {

    protected Skill() {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private int durationMinutes;

    @Column(length = 120)
    private String category;

    @Column(length = 20)
    private String level;

    /** Örn: "online,in-person" */
    @Column(name = "session_types", length = 120)
    private String sessionTypes;

    /** İn-person için Türkiye ili */
    @Column(name = "in_person_location", length = 120)
    private String inPersonLocation;

    /** Örn: "MONDAY,TUESDAY,WEDNESDAY" */
    @Column(name = "available_days", length = 200)
    private String availableDays;

    /** HH:mm */
    @Column(name = "available_from", length = 5)
    private String availableFrom;

    /** HH:mm */
    @Column(name = "available_until", length = 5)
    private String availableUntil;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    /** AI (Pollinations) kapak görseli; harici URL. */
    @Column(name = "cover_image_url", columnDefinition = "TEXT")
    private String coverImageUrl;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
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

    public User getOwner() {
        return owner;
    }

    public String getSessionTypes() {
        return sessionTypes;
    }

    public String getInPersonLocation() {
        return inPersonLocation;
    }

    public String getAvailableDays() {
        return availableDays;
    }

    public String getAvailableFrom() {
        return availableFrom;
    }

    public String getAvailableUntil() {
        return availableUntil;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setDurationMinutes(int durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }

    public void setSessionTypes(String sessionTypes) {
        this.sessionTypes = sessionTypes;
    }

    public void setInPersonLocation(String inPersonLocation) {
        this.inPersonLocation = inPersonLocation;
    }

    public void setAvailableDays(String availableDays) {
        this.availableDays = availableDays;
    }

    public void setAvailableFrom(String availableFrom) {
        this.availableFrom = availableFrom;
    }

    public void setAvailableUntil(String availableUntil) {
        this.availableUntil = availableUntil;
    }

    public String getCoverImageUrl() {
        return coverImageUrl;
    }

    public void setCoverImageUrl(String coverImageUrl) {
        this.coverImageUrl = coverImageUrl;
    }
}