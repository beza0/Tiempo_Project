package com.timebank.timebank.transaction;

public enum TransactionType {
    EARN,
    SPEND,
    /** Saat paketi satın alımı (demo modda; gerçek PSP doğrulaması gelince prod'da) */
    PURCHASE
}