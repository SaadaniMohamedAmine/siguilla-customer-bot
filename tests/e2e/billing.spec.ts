import { test, expect } from "@playwright/test";

test.skip(!process.env.STRIPE_SECRET_KEY, "Stripe not configured");

test("upgrade to Pro via Stripe Checkout (test mode)", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel(/work email/i).fill("test1@sigilla.app");
  await page.getByLabel(/password/i).fill("Test1Sigilla!");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/agents/, { timeout: 15_000 });

  await page.goto("/settings?tab=billing");
  await page.getByRole("button", { name: /upgrade to pro/i }).click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15_000 });

  await page.locator('input[name="cardNumber"], input[autocomplete="cc-number"]').fill("4242424242424242");
  await page.locator('input[name="cardExpiry"], input[autocomplete="cc-exp"]').fill("12/34");
  await page.locator('input[name="cardCvc"], input[autocomplete="cc-csc"]').fill("123");
  const nameField = page.locator('input[name="billingName"]');
  if (await nameField.isVisible().catch(() => false)) await nameField.fill("E2E Tester");
  await page.getByRole("button", { name: /subscribe|pay/i }).click();

  await page.waitForURL(/\/settings\?tab=billing&billing=success/, { timeout: 30_000 });
  // Le webhook (via `stripe listen` en local) doit avoir mis à jour le plan avant ~5s.
  await expect(page.getByText(/pro/i).first()).toBeVisible({ timeout: 10_000 });
});
