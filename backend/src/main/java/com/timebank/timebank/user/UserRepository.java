package com.timebank.timebank.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmail(String email);

    long countByEmailVerifiedTrue();

    /**
     * Atomik düşüm: yalnızca bakiye yeterliyse günceller. Eşzamanlı isteklerde "oku-yaz" yarışını önler.
     *
     * @return güncellenen satır sayısı (0 = yetersiz bakiye)
     */
    @Transactional
    @Modifying(flushAutomatically = true, clearAutomatically = false)
    @Query(value = "UPDATE users SET time_credit_minutes = time_credit_minutes - :minutes "
            + "WHERE id = :id AND time_credit_minutes >= :minutes", nativeQuery = true)
    int debitIfSufficient(@Param("id") UUID id, @Param("minutes") long minutes);

    /** Atomik ekleme (kazanım, iade, satın alma). */
    @Transactional
    @Modifying(flushAutomatically = true, clearAutomatically = false)
    @Query(value = "UPDATE users SET time_credit_minutes = time_credit_minutes + :minutes WHERE id = :id",
            nativeQuery = true)
    int credit(@Param("id") UUID id, @Param("minutes") long minutes);

    /** Kullanıcı satırını kilitler: aynı kişiyi içeren kabul/çakışma kontrollerini sıraya sokar. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") UUID id);

    @Query(value = "SELECT time_credit_minutes FROM users WHERE id = :id", nativeQuery = true)
    long readBalance(@Param("id") UUID id);
}
