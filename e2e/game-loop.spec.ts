import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const blueprint = {
  schemaVersion: "1.0",
  title: "Orbit Orchard",
  oneLine: "Collect comet fruit and dodge storm stones before the route closes.",
  theme: {
    world: "Signal orchard",
    player: "orbit gardener",
    collectible: "comet fruit",
    hazard: "storm stones",
    palette: ["#120D2E", "#7CFFCB", "#FF6B8A"],
  },
  durationSeconds: 30,
  intensity: "gentle",
  gestures: ["reach_left", "reach_right", "duck", "freeze"],
  spawnEveryMs: 1100,
  hazardRatio: 0.3,
  pointsPerCollectible: 10,
  instructions: ["Reach for comet fruit.", "Duck under storm stones."],
};

test("controller and display complete the playable round with recovery and a saved result", async ({ context, page: controller }) => {
  await controller.addInitScript((game) => {
    localStorage.setItem("move-canvas:active-blueprint", JSON.stringify(game));
  }, blueprint);
  await controller.goto("/pair");

  const displayHref = await controller.getByRole("link", { name: "Open display" }).getAttribute("href");
  expect(displayHref).toBeTruthy();
  const display = await context.newPage();
  await display.goto(displayHref!);

  await expect(controller.getByRole("button", { name: "Start round" })).toBeVisible();
  await controller.getByRole("button", { name: "Start round" }).click();
  await expect(display.getByRole("heading", { name: "Reach Left" })).toBeVisible();

  await controller.getByText("Keyboard and testing controls").click();
  await controller.getByRole("button", { name: "Reach Left" }).click();
  await expect(display.getByText("Score 10")).toBeVisible();
  await expect(display.getByRole("heading", { name: "Reach Right" })).toBeVisible();

  await controller.getByRole("button", { name: "Pause round" }).click();
  await expect(display.getByRole("heading", { name: "Hold still" })).toBeVisible();
  await controller.getByRole("button", { name: "Resume round" }).click();
  await controller.getByRole("button", { name: "Reach Right" }).click();
  await expect(display.getByText("Score 21")).toBeVisible();

  await expect(display.getByText("ROUND COMPLETE")).toBeVisible({ timeout: 14_000 });
  await expect(controller.getByRole("button", { name: "Play again" })).toBeVisible();
  const savedResult = await controller.evaluate(() => localStorage.getItem("move-canvas:last-result"));
  expect(savedResult).not.toBeNull();
  expect(JSON.parse(savedResult!).gameTitle).toBe("Orbit Orchard");
});

test("controller and display have no serious axe violations and start by keyboard", async ({ context, page: controller }) => {
  await controller.addInitScript((game) => {
    localStorage.setItem("move-canvas:active-blueprint", JSON.stringify(game));
  }, blueprint);
  await controller.goto("/pair");
  const displayHref = await controller.getByRole("link", { name: "Open display" }).getAttribute("href");
  const display = await context.newPage();
  await display.goto(displayHref!);

  const start = controller.getByRole("button", { name: "Start round" });
  await expect(start).toBeVisible();
  await start.focus();
  await controller.keyboard.press("Enter");
  await expect(display.getByRole("heading", { name: "Reach Left" })).toBeVisible();

  const controllerAxe = await new AxeBuilder({ page: controller }).analyze();
  const displayAxe = await new AxeBuilder({ page: display }).analyze();
  const severe = [...controllerAxe.violations, ...displayAxe.violations]
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical");
  expect(severe).toEqual([]);
});
