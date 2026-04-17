import { apiFetch } from "./client";

export type ReviewDto = {
  id: string;
  exchangeRequestId: string;
  reviewerId: string;
  reviewerName: string;
  reviewedUserId: string;
  reviewedUserName: string;
  /** Ders / beceri başlığı (backend) */
  skillTitle?: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type UserRatingSummaryDto = {
  totalReviews: number;
  averageRating: number;
};

export function fetchMyReceivedReviews(token: string) {
  return apiFetch<ReviewDto[]>("/api/reviews/me/received", {
    method: "GET",
    token,
  });
}

export function fetchMyRatingSummary(token: string) {
  return apiFetch<UserRatingSummaryDto>("/api/reviews/me/summary", {
    method: "GET",
    token,
  });
}

/** Benim yazdığım yorumlar (eğitmenlere verdiğim puanlar) */
export function fetchMyGivenReviews(token: string) {
  return apiFetch<ReviewDto[]>("/api/reviews/me/given", {
    method: "GET",
    token,
  });
}

export function fetchMyGivenRatingSummary(token: string) {
  return apiFetch<UserRatingSummaryDto>("/api/reviews/me/given/summary", {
    method: "GET",
    token,
  });
}

export function createReview(
  token: string,
  exchangeRequestId: string,
  body: { rating: number; comment?: string | null },
) {
  return apiFetch<ReviewDto>(`/api/reviews/exchange/${exchangeRequestId}`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}
