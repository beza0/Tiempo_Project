import { describe, expect, it } from "vitest";
import { resolvePostAuthRedirect } from "./postAuthRedirect";

describe("resolvePostAuthRedirect", () => {
  it("keeps the protected target (e.g. payment return with query)", () => {
    expect(
      resolvePostAuthRedirect(
        { from: { pathname: "/payment/return", search: "?sessionId=1&status=success" } },
        "/dashboard",
      ),
    ).toBe("/payment/return?sessionId=1&status=success");
  });

  it("rejects external and protocol-relative targets", () => {
    expect(resolvePostAuthRedirect({ from: { pathname: "//evil.example" } }, "/dashboard")).toBe(
      "/dashboard",
    );
    expect(resolvePostAuthRedirect({ from: { pathname: "/\\evil.example" } }, "/dashboard")).toBe(
      "/dashboard",
    );
    expect(resolvePostAuthRedirect({ from: { pathname: "https://evil.example" } }, "/dashboard")).toBe(
      "/dashboard",
    );
  });
});
