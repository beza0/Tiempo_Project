import { expect, test } from "@playwright/test";

/** Yeni / yeniden yazılan sayfalar gerçek içerik gösterir (önceden tek paragraflık taslaklardı). */
test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: route.request().url().includes("/auth/session") ? 401 : 200, contentType: "application/json", body: "[]" }),
  );
});

for (const [path, heading] of [
  ["/community", /Topluluk|Community/],
  ["/support", /Destek ve yardım|Help & support/],
  ["/instructor-guide", /Eğitmen rehberi|Instructor guide/],
] as const) {
  test(`${path} renders real content`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.locator("main h2").first()).toBeVisible();
    await expect(page.getByText("support@tiempos.local")).toHaveCount(0);
  });
}

test("unknown route shows a helpful 404", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Sayfa bulunamadı|Page not found/);
  await expect(page.getByRole("link", { name: /Ana sayfa|Home/ }).first()).toBeVisible();
});

test("footer links to community, support and instructor guide", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer");
  for (const href of ["/community", "/support", "/instructor-guide"]) {
    await expect(footer.locator(`a[href="${href}"]`)).toHaveCount(1);
  }
});
