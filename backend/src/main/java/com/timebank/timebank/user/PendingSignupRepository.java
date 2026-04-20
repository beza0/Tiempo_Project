package com.timebank.timebank.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PendingSignupRepository extends JpaRepository<PendingSignup, UUID> {

    Optional<PendingSignup> findByEmail(String email);
}
