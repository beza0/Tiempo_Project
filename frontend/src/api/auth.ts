import { apiFetch } from "./client";

export type LoginResponse = {
  token: string;
  userId: string;
  email: string;
  fullName: string;
  role: string;
};

export type RegisterResponse = {
  id: string;
  fullName: string;
  email: string;
  timeCreditMinutes: number;
  /** SMTP ile doğrulama bekleniyorsa true */
  emailVerificationPending?: boolean;
  /** API gerçek SMTP ile gönderiyor mu (host ve app.mail.enabled) */
  smtpMailDeliveryEnabled?: boolean;
  /** Mailpit / yerel test — gelen kutusu değil */
  smtpLocalCapture?: boolean;
};

export async function loginRequest(body: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function registerRequest(body: {
  fullName: string;
  email: string;
  password: string;
}): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function verifyEmailWithCode(body: {
  email: string;
  code: string;
}): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({
      email: body.email.trim().toLowerCase(),
      code: body.code.replace(/\D/g, "").slice(0, 6),
    }),
  });
}

export async function resendVerificationEmail(email: string): Promise<void> {
  return apiFetch<void>("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
