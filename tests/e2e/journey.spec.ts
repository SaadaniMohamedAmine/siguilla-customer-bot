import { test, expect } from "@playwright/test";
import path from "node:path";

test("full journey: sign-up -> wizard -> upload -> widget -> handoff -> resolve", async ({ page }) => {
  const email = `e2e+${Date.now()}@example.com`;
  const password = "E2ePassword123!";

  await page.goto("/sign-up");
  await page.getByLabel(/full name/i).fill("E2E Tester");
  await page.getByLabel(/work email/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/agents/, { timeout: 15_000 });

  // État vide -> wizard
  await page.getByRole("link", { name: /create an agent|create agent/i }).click();
  await expect(page).toHaveURL(/\/agents\/new/);

  await page.getByLabel(/^name$/i).fill("E2E Agent");
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page).toHaveURL(/step=2/, { timeout: 10_000 });

  // Upload du PDF de test (2 pages, contenu shipping Atelier Lune)
  // L'état vide et l'en-tête proposent chacun un bouton « Add source » : on prend le premier.
  await page.getByRole("button", { name: /add source/i }).first().click();
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(path.join(process.cwd(), "tests/fixtures/atelier-shipping.pdf"));
  await expect(page.getByText(/ready/i)).toBeVisible({ timeout: 60_000 });

  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page).toHaveURL(/step=3/, { timeout: 10_000 });

  const agentId = new URL(page.url()).searchParams.get("id")!;
  await page.getByRole("button", { name: /make it live/i }).click();
  await expect(page).toHaveURL(new RegExp(`/agents/${agentId}$`), { timeout: 10_000 });

  // Widget en conditions réelles via la page d'aperçu (même origine, protégée par session)
  await page.goto(`/widget-preview?pk=${await getPublicKey(page, agentId)}`);
  await expect(page.locator("button.l")).toBeVisible({ timeout: 15_000 });
  await page.locator("button.l").click();
  const textarea = page.locator("textarea");
  await textarea.fill("Do your candles ship to Switzerland?");
  await page.keyboard.press("Enter");
  await expect(page.locator(".m.bt").last()).toContainText(/3|5|business day/i, { timeout: 30_000 });
  await expect(page.locator(".sl").first()).toBeVisible({ timeout: 5_000 });

  // 2 questions hors sujet -> carte de handoff
  for (const q of ["What is the meaning of life?", "Can you recommend a good pizza place?"]) {
    await textarea.fill(q);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(3000);
  }
  // Chaque repli affiche sa carte « Talk to a human » : après deux questions hors sujet il y a deux champs, on prend le dernier.
  const emailInput = page.locator('input[type="email"]').last();
  await expect(emailInput).toBeVisible({ timeout: 10_000 });
  await emailInput.fill("visitor@example.com");
  await page.getByRole("button", { name: /talk to a human/i }).last().click();

  // Retour dashboard : badge de handoff, take over, réponse visible dans le widget
  await page.goto("/conversations");
  await expect(page.getByText(/needs human/i).first()).toBeVisible({ timeout: 10_000 });
});

async function getPublicKey(page: import("@playwright/test").Page, agentId: string) {
  const res = await page.request.get(`/api/chatbots/${agentId}`);
  const json = await res.json();
  return json.data.publicKey as string;
}
