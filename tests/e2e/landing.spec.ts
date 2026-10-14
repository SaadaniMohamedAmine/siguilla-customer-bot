import { test, expect } from "@playwright/test";

test("landing: H1 visible, live-demo CTA, and the real widget answers with a seal", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const demoCta = page.getByRole("link", { name: /explore the live demo/i }).first();
  await expect(demoCta).toBeVisible();
  await demoCta.click();
  await expect(page).toHaveURL(/\/agents/, { timeout: 15_000 });

  await page.goto("/");
  const launcher = page.locator("button.l");
  await expect(launcher).toBeVisible({ timeout: 15_000 });
  await launcher.click();
  await page.locator("textarea").fill("How do citations work?");
  await page.keyboard.press("Enter");
  await expect(page.locator(".sl").first()).toBeVisible({ timeout: 30_000 });
});
