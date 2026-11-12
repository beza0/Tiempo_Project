package com.timebank.timebank.credit.dto;

/**
 * İstemcinin satın alma ekranını açıp açmayacağını belirler.
 *
 * @param purchaseEnabled satın alma akışı kullanılabilir mi
 * @param demoMode        ödeme alınmadan kredi eklenen demo mod mu (yalnızca yerel/test)
 */
public record CreditPurchaseAvailabilityResponse(boolean purchaseEnabled, boolean demoMode) {
}
