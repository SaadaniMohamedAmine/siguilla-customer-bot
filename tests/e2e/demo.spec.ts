import { test, expect } from "@playwright/test";

test("one-click demo access lands on the dashboard, read-only", async ({ page }) => {
  await page.goto("/demo");
  await expect(page).toHaveURL(/\/agents/, { timeout: 15_000 });
  await expect(page.getByText(/exploring a live demo/i)).toBeVisible();

  // Tentative d'écriture (créer un agent) -> toast "read-only" (le serveur bloque, pas l'UI).
  await page.goto("/agents/new");
  await page.getByLabel(/^name$/i).fill("Should be blocked");
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByText(/read-only/i)).toBeVisible({ timeout: 10_000 });
});
