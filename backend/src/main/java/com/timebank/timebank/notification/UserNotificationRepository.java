package com.timebank.timebank.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface UserNotificationRepository extends JpaRepository<UserNotification, UUID> {

    void deleteAllByUser_Id(UUID userId);

    void deleteAllByExchangeRequest_IdIn(Collection<UUID> exchangeRequestIds);

    @Query(
            "SELECT n FROM UserNotification n JOIN n.user u WHERE LOWER(u.email) = LOWER(:email) ORDER BY n.createdAt DESC")
    List<UserNotification> findByUserEmailOrderByCreatedAtDesc(@Param("email") String email);

    @Query(
            "SELECT COUNT(n) FROM UserNotification n JOIN n.user u WHERE LOWER(u.email) = LOWER(:email) AND n.readAt IS NULL")
    long countUnreadByUserEmail(@Param("email") String email);
}
