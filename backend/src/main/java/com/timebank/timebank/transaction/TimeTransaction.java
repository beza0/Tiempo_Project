package com.timebank.timebank.transaction;

import com.timebank.timebank.exchange.ExchangeRequest;
import com.timebank.timebank.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "time_transactions")
public class TimeTransaction {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exchange_request_id")
    private ExchangeRequest exchangeRequest;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionType type;

    @Column(nullable = false)
    private int minutes;

    @Column(nullable = false, length = 255)
    private String description;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public ExchangeRequest getExchangeRequest() {
        return exchangeRequest;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public void setExchangeRequest(ExchangeRequest exchangeRequest) {
        this.exchangeRequest = exchangeRequest;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }

    public void setMinutes(int minutes) {
        this.minutes = minutes;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}