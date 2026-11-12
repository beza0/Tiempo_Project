import { apiFetch } from "./client";

export type CreditCheckoutDto = {
  sessionId: string;
  packageId: string;
  displayHours: number;
  amountTry: number;
  totalMinutes: number;
  provider: string;
  demoMode: boolean;
  checkoutUrl: string | null;
};

export type CreditPurchaseCompleteDto = {
  timeCreditMinutes: number;
  minutesAdded: number;
  displayHours: number;
  amountTry: number;
};

export type CreditPurchaseAvailabilityDto = {
  /** Satın alma akışı açık mı (gerçek ödeme altyapısı yoksa yalnızca demo ortamında). */
  purchaseEnabled: boolean;
  demoMode: boolean;
};

/** Oturum HttpOnly çerezle de taşınır; token yalnızca varsa Bearer olarak eklenir. */
export async function fetchCreditPurchaseAvailability(
  token?: string | null,
): Promise<CreditPurchaseAvailabilityDto> {
  return apiFetch<CreditPurchaseAvailabilityDto>("/api/credits/availability", {
    token,
  });
}

export async function startCreditCheckout(
  packageId: string,
  token?: string | null,
): Promise<CreditCheckoutDto> {
  return apiFetch<CreditCheckoutDto>("/api/credits/checkout", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packageId }),
  });
}

export async function completeCreditPurchase(
  sessionId: string,
  token?: string | null,
): Promise<CreditPurchaseCompleteDto> {
  return apiFetch<CreditPurchaseCompleteDto>(
    `/api/credits/complete/${encodeURIComponent(sessionId)}`,
    {
      method: "POST",
      token,
    },
  );
}
