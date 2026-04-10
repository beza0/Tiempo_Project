import { apiFetch } from "./client";

export type ReviewDto = {
  id: string;
  exchangeRequestId: string;
  reviewerId: string;
  reviewerName: string;
  reviewedUserId: string;
  reviewedUserName: string;
  rating: number;
  comment: string;
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
