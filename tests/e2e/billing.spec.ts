import { test, expect } from "@playwright/test";

test.skip(!process.env.STRIPE_SECRET_KEY, "Stripe not configured");

test("upgrade to Pro via Stripe Checkout (test mode)", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel(/work email/i).fill("test1@sigilla.app");
  await page.getByLabel(/^password$/i).fill("Test1Sigilla!");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/agents/, { timeout: 15_000 });

  await page.goto("/settings?tab=billing");
  await page.getByRole("button", { name: /upgrade to pro/i }).click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });

  // Le moyen de paiement "Card" est parfois un accordéon replié (Apple Pay/Link/Amazon Pay
  // proposés en premier), parfois déjà ouvert par défaut selon l'état de Stripe Checkout —
  // les champs carte n'existent dans le DOM que si l'accordéon est déplié. Le bouton existe
  // (`attached`) mais Playwright le juge parfois `hidden` pendant que l'accordéon est encore
  // en cours de rendu, et le calque visuel (`AccordionItemCover-actionContainer`) intercepte
  // systématiquement son clic "pointeur réel" (y compris avec `force: true`) — donc on attend
  // juste sa présence dans le DOM puis on appelle le vrai `.click()` natif, même mécanisme
  // qu'un clic utilisateur réel, sans la vérification géométrique/visibilité de Playwright.
  await page
    .locator('[data-testid="card-accordion-item-button"]')
    .waitFor({ state: "attached", timeout: 10_000 })
    .catch(() => {});
  await page.evaluate(() => {
    const btn = document.querySelector<HTMLButtonElement>('[data-testid="card-accordion-item-button"]');
    btn?.click();
  });

  await page.locator('input[name="cardNumber"], input[autocomplete="cc-number"]').fill("4242424242424242");
  await page.locator('input[name="cardExpiry"], input[autocomplete="cc-exp"]').fill("12/34");
  await page.locator('input[name="cardCvc"], input[autocomplete="cc-csc"]').fill("123");
  const nameField = page.locator('input[name="billingName"]');
  if (await nameField.isVisible().catch(() => false)) await nameField.fill("E2E Tester");
  // `/subscribe|pay/i` matche aussi les boutons d'accordéon ("Pay with Cash App"...) —
  // le vrai bouton de soumission final a son propre data-testid, stable quelle que soit
  // la langue (Stripe Checkout se localise selon le navigateur — EN ou FR vus en pratique).
  await page.locator('[data-testid="hosted-payment-submit-button"]').click();

  await page.waitForURL(/\/settings\?tab=billing&billing=success/, { timeout: 30_000 });
  // Le webhook (via `stripe listen` en local) doit avoir mis à jour le plan avant ~5s.
  await expect(page.getByText(/pro/i).first()).toBeVisible({ timeout: 10_000 });
});
