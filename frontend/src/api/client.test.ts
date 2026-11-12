import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  apiErrorDisplayMessage,
  apiFetch,
  COOKIE_SESSION_TOKEN,
} from "./client";

describe("apiErrorDisplayMessage", () => {
  it("returns ApiError message when meaningful", () => {
    const err = new ApiError("Sunucu hatası", 500);
    expect(apiErrorDisplayMessage(err, "Yedek")).toBe("Sunucu hatası");
  });

  it("uses fallback for generic Forbidden", () => {
    const err = new ApiError("Forbidden", 403);
    expect(apiErrorDisplayMessage(err, "Erişim yok")).toBe("Erişim yok");
  });

  it("uses fallback for unknown errors", () => {
    expect(apiErrorDisplayMessage(new Error(), "Bir şeyler ters gitti")).toBe(
      "Bir şeyler ters gitti",
    );
  });
});

describe("apiFetch auth header", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch() {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  function sentHeaders(fetchMock: ReturnType<typeof stubFetch>): Headers {
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    return init.headers as Headers;
  }

  it("sends Bearer for a real token", async () => {
    const fetchMock = stubFetch();
    await apiFetch("/api/x", { token: "abc" });
    expect(sentHeaders(fetchMock).get("Authorization")).toBe("Bearer abc");
  });

  it("relies on the cookie (no Authorization header) for a cookie-restored session", async () => {
    const fetchMock = stubFetch();
    await apiFetch("/api/x", { token: COOKIE_SESSION_TOKEN });
    expect(sentHeaders(fetchMock).has("Authorization")).toBe(false);
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.credentials).toBe("include");
  });
});
