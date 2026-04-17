import { apiFetch } from "./client";

export type NotificationDto = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  exchangeRequestId: string | null;
  skillTitle: string | null;
};

export function fetchNotifications(token: string) {
  return apiFetch<NotificationDto[]>("/api/notifications", {
    method: "GET",
    token,
  });
}

export function fetchUnreadNotificationCount(token: string) {
  return apiFetch<{ count: number }>("/api/notifications/unread-count", {
    method: "GET",
    token,
  });
}

export function markNotificationRead(token: string, id: string) {
  return apiFetch<void>(`/api/notifications/${id}/read`, {
    method: "PUT",
    token,
  });
}
