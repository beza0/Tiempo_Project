import { getApiBaseUrl } from "../config/env";

export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type ApiFetchOptions = RequestInit & { token?: string | null };

/** Boş veya anlamsız API mesajlarında yerelleştirilmiş fallback kullanın. */
export function apiErrorDisplayMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) {
      return fallback;
    }
    const m = err.message.trim();
    if (!m) return fallback;
    const lower = m.toLowerCase();
    if (lower === "forbidden" || lower === "unauthorized") {
      return fallback;
    }
    return m;
  }
  if (err instanceof Error) {
    const m = err.message.trim();
    return m || fallback;
  }
  return fallback;
}

export async function apiFetch<T>(
  path: string,
  opts: ApiFetchOptions = {},
): Promise<T> {
  const { token, headers, ...rest } = opts;
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const h = new Headers(headers);
  if (
    rest.body != null &&
    !(rest.body instanceof FormData) &&
    !h.has("Content-Type")
  ) {
    h.set("Content-Type", "application/json");
  }
  if (token) {
    h.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...rest,
    headers: h,
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    if ((res.status === 401 || res.status === 403) && typeof window !== "undefined") {
      // Session expired/invalid token: force a clean logout flow.
      window.dispatchEvent(new Event("timelink:auth-expired"));
    }
    const msg =
      data &&
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : res.statusText || "";
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}
