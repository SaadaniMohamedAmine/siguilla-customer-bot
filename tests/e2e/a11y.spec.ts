import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/", "/pricing", "/docs/getting-started", "/sign-in"];

for (const path of PAGES) {
  test(`a11y: ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
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
