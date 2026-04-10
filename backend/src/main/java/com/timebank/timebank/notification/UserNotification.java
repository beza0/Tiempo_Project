package com.timebank.timebank.notification;

import com.timebank.timebank.exchange.ExchangeRequest;
import com.timebank.timebank.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_notifications")
public class UserNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 2000)
    private String body;

    @Column(name = "read_at")
    private Instant readAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exchange_request_id")
    private ExchangeRequest exchangeRequest;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected UserNotification() {
    }

    public UserNotification(User user, String title, String body, ExchangeRequest exchangeRequest) {
        this.user = user;
        this.title = title;
        this.body = body;
        this.exchangeRequest = exchangeRequest;
    }

    @PrePersist
    void prePersist() {
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

    public String getTitle() {
        return title;
    }

    public String getBody() {
        return body;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public void setReadAt(Instant readAt) {
        this.readAt = readAt;
    }

    public ExchangeRequest getExchangeRequest() {
        return exchangeRequest;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
