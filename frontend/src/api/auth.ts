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
