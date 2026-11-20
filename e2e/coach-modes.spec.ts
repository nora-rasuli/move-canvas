import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const baseURL = "http://127.0.0.1:3000";

type MediaAudit = { playCount: number; pauseCount: number; currentTime: number };

async function installMediaAudit(page: Page) {
  await page.addInitScript(() => {
    const audit = { playCount: 0, pauseCount: 0, currentTime: 0 };
    Object.defineProperty(window, "__moveCanvasMediaAudit", { value: audit });
    Object.defineProperty(HTMLMediaElement.prototype, "currentTime", {
      configurable: true,
      get: () => audit.currentTime,
      set: (value: number) => { audit.currentTime = value; },
    });
    HTMLMediaElement.prototype.play = async function play() { audit.playCount += 1; };
    HTMLMediaElement.prototype.pause = function pause() { audit.pauseCount += 1; };
  });
}

const readMediaAudit = (page: Page) => page.evaluate(() => (window as typeof window & { __moveCanvasMediaAudit: MediaAudit }).__moveCanvasMediaAudit);
const readComparisonPosition = async (page: Page) => Number.parseFloat((await page.getByTestId("dance-comparison-position").textContent())?.match(/[\d.]+/)?.[0] ?? "0");

test("mode selection exposes three truthful first-class paths", async ({ page }) => {
  await page.goto("/coach");
  await expect(page.getByRole("heading", { name: "Play, compare, or practice." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Motion Game/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Dance Coach/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Tennis Coach/ })).toBeVisible();
  await expect(page.getByText(/do not provide medical, injury-prevention, biomechanics, or professional-coaching analysis/i)).toBeVisible();
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([]);
  await page.screenshot({ path: "evidence/package-1.1/mode-selection.png", fullPage: true });
});

test("dance fixture verifies paired semantic flow without claiming real-device evidence", async ({ browser }) => {
  const displayContext = await browser.newContext({ baseURL, reducedMotion: "reduce" });
  const phoneContext = await browser.newContext({ baseURL, viewport: { width: 360, height: 780 }, reducedMotion: "reduce" });
  const display = await displayContext.newPage();
  await installMediaAudit(display);
  await display.goto("/coach/dance");
  await display.getByText("Deterministic verification controls").click();
  await expect(display.getByText(/not real-clip or real-device evidence/i)).toBeVisible();
  await display.getByRole("button", { name: "Load landmark fixture" }).click();
  await expect(display.getByText(/101 confidence-qualified samples/i)).toBeVisible();

  const controllerHref = await display.getByRole("link", { name: "Open phone controller" }).getAttribute("href");
  expect(controllerHref).toBeTruthy();
  const phone = await phoneContext.newPage();
  await phone.goto(controllerHref!);
  await expect(display.getByText("Phone connected")).toBeVisible({ timeout: 10_000 });
  await expect(phone.getByText("Display connected")).toBeVisible();
  await phone.getByText("Deterministic verification controls").click();
  await phone.getByRole("button", { name: "Use fixture framing" }).click();
  await expect(phone.getByText("Session calibration record")).toBeVisible();
  await expect(phone.getByRole("button", { name: "Start on phone" })).toBeEnabled();

  await display.getByRole("button", { name: "Start practice" }).click();
  await expect.poll(async () => (await readMediaAudit(display)).playCount).toBe(1);
  await display.waitForTimeout(400);
  await phone.getByRole("button", { name: "Pause", exact: true }).click();
  await expect.poll(async () => (await readMediaAudit(display)).pauseCount).toBe(1);
  const pausedElapsed = await readComparisonPosition(phone);
  expect(pausedElapsed).toBeGreaterThan(0.2);
  await phone.waitForTimeout(300);
  expect(await readComparisonPosition(phone)).toBe(pausedElapsed);

  await phone.getByRole("button", { name: "Resume", exact: true }).click();
  await expect.poll(async () => (await readMediaAudit(display)).playCount).toBe(2);
  expect((await readMediaAudit(display)).currentTime).toBeGreaterThanOrEqual(pausedElapsed - 0.1);
  await phone.waitForTimeout(250);
  expect(await readComparisonPosition(phone)).toBeGreaterThan(pausedElapsed);

  await display.getByRole("button", { name: "Pause", exact: true }).click();
  await expect.poll(async () => (await readMediaAudit(display)).pauseCount).toBe(2);
  await phone.reload();
  await expect(phone.getByText("Display connected")).toBeVisible({ timeout: 10_000 });
  await expect(phone.getByText("Session calibration record")).toBeVisible();
  await expect(phone.getByRole("button", { name: "Resume", exact: true })).toBeVisible();
  await phone.getByText("Deterministic verification controls").click();
  await phone.getByRole("button", { name: "Resume", exact: true }).click();
  await expect.poll(async () => (await readMediaAudit(display)).playCount).toBe(3);
  await phone.getByRole("button", { name: "Simulate tracking loss" }).click();
  await expect.poll(async () => (await readMediaAudit(display)).pauseCount).toBe(3);
  await phone.getByRole("button", { name: "Resume", exact: true }).click();
  await expect.poll(async () => (await readMediaAudit(display)).playCount).toBe(4);

  await phone.getByRole("button", { name: "Send next fixture comparison" }).click();
  await expect(display.getByTestId("dance-comparison-offset")).toContainText("320 ms");
  await phone.getByRole("button", { name: "Send next fixture comparison" }).click();
  await phone.getByRole("button", { name: "Send next fixture comparison" }).click();
  await phone.getByRole("button", { name: "End safely" }).click();
  await expect.poll(async () => (await readMediaAudit(display)).pauseCount).toBe(4);
  await expect(display.getByRole("heading", { name: "Session complete" })).toBeVisible();
  await expect(display.getByText(/estimated 2D pose and timing/i).last()).toBeVisible();

  const saved = await phone.evaluate(() => localStorage.getItem("move-canvas:last-coach-summary"));
  expect(saved).not.toBeNull();
  expect(JSON.parse(saved!).mode).toBe("dance-coach");
  const phoneAxe = await new AxeBuilder({ page: phone }).analyze();
  expect(phoneAxe.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([]);
  await display.screenshot({ path: "evidence/package-1.1/dance-result-fixture.png", fullPage: true });
  await phone.screenshot({ path: "evidence/package-1.1/dance-phone-360-fixture.png", fullPage: true });
  await Promise.all([displayContext.close(), phoneContext.close()]);
});

for (const drill of ["Shadow Serve", "Shadow Forehand"] as const) {
  test(`${drill} fixture requires three ordered semantic reps`, async ({ browser }) => {
    const displayContext = await browser.newContext({ baseURL, reducedMotion: "reduce" });
    const phoneContext = await browser.newContext({ baseURL, viewport: { width: 360, height: 780 }, reducedMotion: "reduce" });
    const display = await displayContext.newPage();
    await display.goto("/coach/tennis");
    await display.getByLabel(drill).check();
    const controllerHref = await display.getByRole("link", { name: "Open phone controller" }).getAttribute("href");
    const phone = await phoneContext.newPage();
    await phone.goto(controllerHref!);
    await expect(display.getByText("Phone connected")).toBeVisible({ timeout: 10_000 });
    await phone.getByText("Deterministic verification controls").click();
    await expect(phone.getByRole("button", { name: "Use fixture framing" })).toBeEnabled();
    await phone.getByRole("button", { name: "Use fixture framing" }).click();
    await expect(phone.getByText("Session calibration record")).toBeVisible();

    if (drill === "Shadow Serve") {
      await display.getByRole("button", { name: "Start practice" }).focus();
      await display.getByRole("button", { name: "Start practice" }).press("Enter");
      await expect(display.getByText("Tennis practice starts in 3", { exact: true })).toBeVisible();
      await expect(phone.getByText("Tennis practice starts in 3", { exact: true })).toBeVisible();
      await phone.getByRole("button", { name: "Cancel countdown" }).focus();
      await phone.getByRole("button", { name: "Cancel countdown" }).press("Space");
      await expect(display.getByRole("button", { name: "Start practice" })).toBeVisible();
      await phone.waitForTimeout(3_200);
      await expect(phone.getByRole("button", { name: "Start on phone" })).toBeVisible();
      await phone.getByRole("button", { name: "Start on phone" }).focus();
      await phone.getByRole("button", { name: "Start on phone" }).press("Enter");
      await expect(display.getByText(/Tennis practice starts in 3/)).toBeVisible();
    } else {
      await display.getByRole("button", { name: "Start practice" }).click();
    }
    await expect(phone.getByRole("button", { name: "Pause", exact: true })).toBeEnabled({ timeout: 5_000 });

    const displayAxe = await new AxeBuilder({ page: display }).analyze();
    const phoneAxe = await new AxeBuilder({ page: phone }).analyze();
    expect(displayAxe.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([]);
    expect(phoneAxe.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([]);

    const phases = drill === "Shadow Serve"
      ? ["ready", "trophy", "reach proxy", "follow through"]
      : ["ready", "unit turn", "load", "contact zone proxy", "finish"];
    for (let rep = 0; rep < 3; rep += 1) {
      for (const phase of phases) await phone.getByRole("button", { name: phase, exact: true }).click();
    }
    await expect(display.getByRole("heading", { name: "Session complete" })).toBeVisible();
    await expect(display.getByText(/coarse 2D shadow-movement phases/i).last()).toBeVisible();
    await expect(display.locator(".rep-count")).toContainText("3 / 3");
    await display.screenshot({ path: `evidence/package-1.1/${drill === "Shadow Serve" ? "serve" : "forehand"}-result-fixture.png`, fullPage: true });
    await Promise.all([displayContext.close(), phoneContext.close()]);
  });
}
