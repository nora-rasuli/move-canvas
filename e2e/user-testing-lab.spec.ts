import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("MC-P01/P03 keep the primary paths usable at phone and zoom-equivalent widths", async ({
  page,
}) => {
  await page.setViewportSize({ width: 640, height: 800 });
  await page.goto("/coach");

  await expect(page.getByRole("heading", { name: "Play, compare, or practice." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Dance Coach/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Tennis Coach/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  const axe = await new AxeBuilder({ page }).analyze();
  expect(
    axe.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    ),
  ).toEqual([]);
});

test("MC-P04/P05 expose visible status and large action targets without relying on audio", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/coach/dance");

  await expect(page.getByText("1 · PREPARE ON THIS DISPLAY")).toBeVisible();
  await expect(page.getByText("2 · PAIR THE PHONE CAMERA")).toBeVisible();
  await expect(page.getByRole("status")).toContainText(/Choose a reference/i);

  const targets = await page.locator("main button:visible").evaluateAll((buttons) =>
    buttons.map((button) => {
      const box = button.getBoundingClientRect();
      return { label: button.textContent?.trim() ?? "", width: box.width, height: box.height };
    }),
  );
  expect(targets.length).toBeGreaterThan(0);
  for (const target of targets) {
    expect.soft(target.height, `${target.label} target height`).toBeGreaterThanOrEqual(44);
  }
});

test("MC-P08 honors reduced-motion preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/coach");

  const motion = await page.getByRole("link", { name: /Dance Coach/ }).evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      animationDuration: style.animationDuration,
      transitionDuration: style.transitionDuration,
    };
  });
  const seconds = (value: string) =>
    value.endsWith("ms") ? Number.parseFloat(value) / 1_000 : Number.parseFloat(value);
  expect(seconds(motion.animationDuration)).toBeLessThanOrEqual(0.00001);
  expect(motion.transitionDuration.split(", ").every((value) => seconds(value) <= 0.00001)).toBe(
    true,
  );
});
