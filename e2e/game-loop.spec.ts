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

const baseURL = "http://127.0.0.1:3000";

test("multiple phone controllers and a display complete a shared round", async ({ browser }) => {
  test.setTimeout(40_000);
  const controllerContext = await browser.newContext({ baseURL });
  const displayContext = await browser.newContext({ baseURL });
  const guestContext = await browser.newContext({ baseURL });
  const controller = await controllerContext.newPage();
  await controller.addInitScript((game) => {
    localStorage.setItem("move-canvas:active-blueprint", JSON.stringify(game));
    localStorage.setItem("move-canvas:player", JSON.stringify({ id: "host-player", name: "Nora", color: "#C8FF54" }));
  }, blueprint);
  await controller.goto("/pair");

  const displayHref = await controller.getByRole("link", { name: "Open display" }).getAttribute("href");
  expect(displayHref).toBeTruthy();
  const display = await displayContext.newPage();
  await display.goto(displayHref!);

  const code = displayHref!.split("/").at(-1)!;
  const guest = await guestContext.newPage();
  await guest.addInitScript(() => {
    localStorage.removeItem("move-canvas:active-blueprint");
    localStorage.setItem("move-canvas:player", JSON.stringify({ id: "guest-player", name: "Sam", color: "#FF6B62" }));
  });
  await guest.goto(`/pair?code=${code}`);

  await expect(controller.getByRole("button", { name: "Start round" })).toBeVisible();
  await expect(guest.getByRole("button", { name: "Start round" })).toBeVisible();
  await expect(display.getByText("Players 2")).toBeVisible();
  await controller.getByRole("button", { name: "Start round" }).click();
  await expect(display.getByRole("heading", { name: "Reach Left" })).toBeVisible();

  await guest.getByText("Keyboard and testing controls").click();
  await guest.getByRole("button", { name: "Reach Left" }).click();
  await expect(display.getByText("Team 10")).toBeVisible();
  await expect(guest.getByText("Sam 10")).toBeVisible();
  await expect(display.getByRole("heading", { name: "Reach Right" })).toBeVisible();

  await controller.getByRole("button", { name: "Pause round" }).click();
  await expect(display.getByRole("heading", { name: "Hold still" })).toBeVisible();
  await controller.getByRole("button", { name: "Resume round" }).click();
  await guest.getByRole("button", { name: "Reach Right" }).click();
  await expect(display.getByText("Team 21")).toBeVisible();

  await expect(display.getByText("ROUND COMPLETE")).toBeVisible({ timeout: 20_000 });
  await expect(controller.getByRole("button", { name: "Play again" })).toBeVisible();
  const savedResult = await controller.evaluate(() => localStorage.getItem("move-canvas:last-result"));
  expect(savedResult).not.toBeNull();
  expect(JSON.parse(savedResult!).gameTitle).toBe("Orbit Orchard");
  await Promise.all([controllerContext.close(), displayContext.close(), guestContext.close()]);
});

test("controller and display have no serious axe violations and start by keyboard", async ({ browser }) => {
  const controllerContext = await browser.newContext({ baseURL });
  const displayContext = await browser.newContext({ baseURL });
  const controller = await controllerContext.newPage();
  await controller.addInitScript((game) => {
    localStorage.setItem("move-canvas:active-blueprint", JSON.stringify(game));
  }, blueprint);
  await controller.goto("/pair");
  const displayHref = await controller.getByRole("link", { name: "Open display" }).getAttribute("href");
  const display = await displayContext.newPage();
  await display.goto(displayHref!);

  const start = controller.getByRole("button", { name: "Start round" });
  await expect(start).toBeVisible();
  await expect(display.getByText("Start the round from your phone")).toBeVisible();
  await start.focus();
  await controller.keyboard.press("Enter");
  await expect(display.getByRole("heading", { name: "Reach Left" })).toBeVisible();

  const controllerAxe = await new AxeBuilder({ page: controller }).analyze();
  const displayAxe = await new AxeBuilder({ page: display }).analyze();
  const severe = [...controllerAxe.violations, ...displayAxe.violations]
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical");
  expect(severe).toEqual([]);
  await Promise.all([controllerContext.close(), displayContext.close()]);
});
