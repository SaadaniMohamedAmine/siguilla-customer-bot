import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = [
  "/",
  "/pricing",
  "/docs",
  "/docs/getting-started",
  "/privacy",
  "/terms",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
];
const THEMES = ["dark", "light"] as const;

for (const theme of THEMES) {
  for (const path of PAGES) {
    test(`a11y (${theme}): ${path}`, async ({ page, baseURL }) => {
      // Splash déjà vu : son fondu de sortie fausserait le calcul de contraste (il a son propre test, B11).
      await page.context().addCookies([{ name: "sg_splash", value: "1", url: baseURL! }]);
      // next-themes lit sa préférence dans localStorage (clé « theme ») avant l'hydratation.
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await page.goto(path);
      await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`));
      // Les fondus d'entrée (`page-in`, `hero-in`, splash) faussent le calcul de contraste d'axe : on attend leur fin.
      // Les animations infinies (défilement des marques, curseur) ne se terminent jamais : on les écarte.
      await page.evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
            .map((a) => a.finished.catch(() => undefined)),
        ),
      );
      await page.waitForTimeout(500);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
    });
  }
}

test("widget: full keyboard navigation (Tab, Enter, Tab trap, Escape)", async ({ page }) => {
  // Page tierce (pas d'auth requise, contrairement à /widget-preview) servie par
  // `npx serve tests/fixtures/third-party -l 4321` — voir widget-third-party.spec.ts.
  await page.goto("http://localhost:4321/");
  await expect(page.locator("button.l")).toBeVisible({ timeout: 15_000 });

  await page.keyboard.press("Tab");
  const launcher = page.locator("button.l");
  await expect(launcher).toBeFocused();

  await page.keyboard.press("Enter");
  const panel = page.locator(".p");
  await expect(panel).toBeVisible();

  // Le focus doit rester piégé dans le panneau en bouclant (Tab répété ne sort jamais).
  for (let i = 0; i < 6; i++) await page.keyboard.press("Tab");
  const stillInside = await page.evaluate(() => {
    const host = [...document.body.children].find(
      (el) => (el as HTMLElement & { shadowRoot?: ShadowRoot }).shadowRoot,
    );
    const root = (host as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    return root.activeElement !== null && root.querySelector(".p")?.contains(root.activeElement);
  });
  expect(stillInside).toBe(true);

  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(launcher).toBeFocused();
});
