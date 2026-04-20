package com.timebank.timebank.user.dto;

import java.util.UUID;

public class UserResponse {
    private UUID id;
    private String fullName;
    private String email;
    private long timeCreditMinutes;
    /** SMTP açık ve hesap e-posta ile doğrulanmayı bekliyor */
    private boolean emailVerificationPending;
    /** Doğrulama e-postası gerçek bir SMTP aktarıcıya gidiyor (Gmail vb.) */
    private boolean smtpMailDeliveryEnabled;
    /** Yerel Mailpit / test SMTP — gelen kutusu değil */
    private boolean smtpLocalCapture;

    public UserResponse(
            UUID id,
            String fullName,
            String email,
            long timeCreditMinutes,
            boolean emailVerificationPending
    ) {
        this(id, fullName, email, timeCreditMinutes, emailVerificationPending, false, false);
    }

    public UserResponse(
            UUID id,
            String fullName,
            String email,
            long timeCreditMinutes,
            boolean emailVerificationPending,
            boolean smtpMailDeliveryEnabled,
            boolean smtpLocalCapture
    ) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.timeCreditMinutes = timeCreditMinutes;
        this.emailVerificationPending = emailVerificationPending;
        this.smtpMailDeliveryEnabled = smtpMailDeliveryEnabled;
        this.smtpLocalCapture = smtpLocalCapture;
    }

    public UUID getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public long getTimeCreditMinutes() { return timeCreditMinutes; }
    public boolean isEmailVerificationPending() { return emailVerificationPending; }
    public boolean isSmtpMailDeliveryEnabled() { return smtpMailDeliveryEnabled; }
    public boolean isSmtpLocalCapture() { return smtpLocalCapture; }
}
