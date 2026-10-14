import { test, expect } from "@playwright/test";

// Bot de test réel, allowedDomains vide (non restreint) — voir TEST_USERS.md / PENDING_TESTS.md.
// La clé publique est codée en dur dans tests/fixtures/third-party/index.html (fichier statique
// servi tel quel par `npx serve`, pas de template côté test) — garder les deux en phase si le
// bot de test change un jour.

test.describe("widget on a real third-party page", () => {
  test("mounts in Shadow DOM, isolated from the host page's aggressive CSS", async ({ page }) => {
    await page.goto("http://localhost:4321/");

    // La page hôte reste en Comic Sans / rouge : le widget ne lui a rien injecté.
    const hostFont = await page.locator("#host-heading").evaluate((el) => getComputedStyle(el).fontFamily);
    expect(hostFont).toContain("Comic Sans");

    const launcher = page.locator("button.l");
    await expect(launcher).toBeVisible({ timeout: 15_000 });

    // À l'intérieur du Shadow DOM, aucune fuite du style de la page hôte.
    const widgetFont = await launcher.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(widgetFont).not.toContain("Comic Sans");
    const widgetColor = await launcher.evaluate((el) => getComputedStyle(el).color);
    expect(widgetColor).not.toBe("rgb(255, 0, 0)");
  });
});

// La vérification "origine non autorisée -> pas de launcher" est couverte au niveau unitaire
// (tests/unit/cors.test.ts, originAllowed) plutôt que dupliquée ici avec un 2e bot jetable —
// voir DECISIONS.md.
