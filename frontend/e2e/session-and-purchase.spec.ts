import { expect, test, type Page } from "@playwright/test";

/**
 * Backend gerektirmeyen regresyonlar: API yanıtları taklit edilir.
 */
async function mockApi(page: Page, opts: { loggedIn: boolean; purchaseEnabled?: boolean }) {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

    if (path === "/api/auth/session") {
      return opts.loggedIn
        ? json({ userId: "u-1", email: "learner@example.test", fullName: "Ada Test", role: "USER" })
        : json({ message: "Unauthorized" }, 401);
    }
    if (path === "/api/credits/availability") {
      return json({ purchaseEnabled: Boolean(opts.purchaseEnabled), demoMode: Boolean(opts.purchaseEnabled) });
    }
    if (path.endsWith("/unread-count")) return json({ count: 0 });
    if (path === "/api/users/me/dashboard") {
      return json({ fullName: "Ada Test", timeCreditMinutes: 90, mySkillsCount: 0, sentRequestsCount: 0, receivedRequestsCount: 0 });
    }
    if (path === "/api/users/me/profile") {
      return json({ id: "u-1", fullName: "Ada Test", email: "learner@example.test", timeCreditMinutes: 90 });
    }
    if (path === "/api/users/me/blocks") return json({ blockedUserIds: [], blockedByUserIds: [] });
    return json([]);
  });
}

test("refreshing a protected page keeps the user on it (cookie session restore)", async ({ page }) => {
  await mockApi(page, { loggedIn: true });
  await page.goto("/notifications");
  await expect(page).toHaveURL(/\/notifications$/);
});

test("logged-out deep link to payment return goes to login, not dashboard", async ({ page }) => {
  await mockApi(page, { loggedIn: false });
  await page.goto("/payment/return?sessionId=abc&status=success");
  await expect(page).toHaveURL(/\/login$/);
});

test("buy credits shows an honest unavailable state when purchases are off", async ({ page }) => {
  await mockApi(page, { loggedIn: true, purchaseEnabled: false });
  await page.goto("/buy-credits");
  await expect(page.getByRole("heading", { name: /Buying hours isn't available yet|Saat satın alma henüz açık değil/ })).toBeVisible();
  await expect(page.getByText(/Proceed to Payment|Ödemeye Geç/)).toHaveCount(0);
});

test("navbar balance shows minutes instead of rounding down to 0h", async ({ page }) => {
  await mockApi(page, { loggedIn: true });
  await page.goto("/dashboard");
  await expect(page.getByText(/1h 30m|1 sa 30 dk/).first()).toBeVisible();
});
