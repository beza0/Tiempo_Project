package com.timebank.timebank.user.dto;

import com.timebank.timebank.user.PendingSignup;
import com.timebank.timebank.user.User;

/**
 * Kayıt sonucu: SMTP doğrulamalı ise yalnızca {@link PendingSignup}; aksi halde oluşturulan {@link User}.
 */
public record RegistrationOutcome(User user, PendingSignup pendingSignup) {

    public static RegistrationOutcome verifiedLater(PendingSignup pending) {
        return new RegistrationOutcome(null, pending);
    }

    public static RegistrationOutcome complete(User user) {
        return new RegistrationOutcome(user, null);
    }

    public boolean isPendingSignup() {
        return pendingSignup != null;
    }
}
