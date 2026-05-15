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

export async function forgotPasswordRequest(email: string): Promise<void> {
  return apiFetch<void>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

export async function resetPasswordRequest(body: {
  email: string;
  token: string;
  newPassword: string;
}): Promise<void> {
  return apiFetch<void>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      email: body.email.trim().toLowerCase(),
      token: body.token.trim(),
      newPassword: body.newPassword,
    }),
  });
}

export type GoogleAuthConfig = {
  clientId: string;
};

export async function fetchGoogleAuthConfig(): Promise<GoogleAuthConfig> {
  return apiFetch<GoogleAuthConfig>("/api/auth/google-config");
}

export async function socialLoginRequest(body: {
  provider: "google";
  idToken?: string;
  accessToken?: string;
}): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/auth/social-login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
