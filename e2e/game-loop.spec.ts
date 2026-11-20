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

const publishedGame = {
  id: "31c8f2f4-218e-4e53-b41b-c43dc7253f93",
  owner_id: "2fa9d54a-4076-49b3-becb-f572b6c5cd23",
  record: {
    version: "1.1",
    blueprint,
    provenance: {
      generator: "deterministic-fallback",
      model: null,
      generatedAt: "2026-11-20T00:00:01.000Z",
      sourcePrompt: "A space orchard where I reach for comet fruit",
      validation: "passed",
      degradedReason: "provider-not-configured",
    },
    edits: [],
    acceptedAt: "2026-11-20T00:00:02.000Z",
  },
  title: blueprint.title,
  description: blueprint.oneLine,
  world: blueprint.theme.world,
  likes_count: 3,
  created_at: "2026-11-20T00:00:03.000Z",
};

async function mockCommunityBackend(page: import("@playwright/test").Page) {
  const user = {
    id: "aa9c3f37-df16-43bf-a605-cb698c36a6a7",
    aud: "authenticated",
    role: "authenticated",
    is_anonymous: true,
  };
  const payload = Buffer.from(
    JSON.stringify({ sub: user.id, role: "authenticated", exp: 4_102_444_800 }),
  ).toString("base64url");
  const accessToken = `eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.${payload}.signature`;
  await page.route("**.supabase.co/auth/v1/**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        access_token: accessToken,
        refresh_token: "test-refresh-token",
        expires_in: 3600,
        expires_at: 4_102_444_800,
        token_type: "bearer",
        user,
      }),
    });
  });
  await page.route("**.supabase.co/rest/v1/game_likes**", async (route) => {
    await route.fulfill({
      status: route.request().method() === "POST" ? 201 : 200,
      contentType: "application/json",
      body: "[]",
    });
  });
  await page.route("**.supabase.co/rest/v1/user_game_library**", async (route) => {
    await route.fulfill({ status: 201, contentType: "application/json", body: "[]" });
  });
  await page.route("**.supabase.co/rest/v1/published_games**", async (route) => {
    await route.fulfill({
      status: route.request().method() === "POST" ? 201 : 200,
      contentType: "application/json",
      headers: { "Content-Range": "0-0/1" },
      body: JSON.stringify(route.request().method() === "POST" ? [publishedGame] : [publishedGame]),
    });
  });
}

test("blueprint review supports regenerate, discard, validated edits, and retained provenance", async ({
  page,
}) => {
  let generation = 0;
  await page.route("**/api/blueprints", async (route) => {
    generation += 1;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        blueprint: {
          ...blueprint,
          title: generation === 1 ? "Orbit Orchard" : "Orbit Orchard Remix",
        },
        provenance: {
          generator: "deterministic-fallback",
          model: null,
          generatedAt: `2026-11-20T00:00:0${generation}.000Z`,
          sourcePrompt: "A space orchard where I reach for comet fruit",
          validation: "passed",
          degradedReason: "provider-not-configured",
        },
      }),
    });
  });

  await page.goto("/#create");
  await page.getByLabel("Your game idea").fill("A space orchard where I reach for comet fruit");
  await page.getByRole("button", { name: "Build my game" }).click();
  await expect(page.getByRole("heading", { name: "Orbit Orchard" })).toBeVisible();

  await page.getByRole("button", { name: "Regenerate from idea" }).click();
  await expect(page.getByRole("heading", { name: "Orbit Orchard Remix" })).toBeVisible();
  await page.getByRole("button", { name: "Discard blueprint" }).click();
  await expect(page.getByRole("heading", { name: "Orbit Orchard Remix" })).toHaveCount(0);
  await expect(page.getByLabel("Your game idea")).toBeFocused();

  await page.getByRole("button", { name: "Build my game" }).click();
  await page.getByLabel("Game title").fill("Nora's Orbit Run");
  await page.getByLabel("Round length").selectOption("60");
  await page.getByLabel("Energy").selectOption("lively");
  await page.getByLabel("Reach Left").uncheck();
  await page.getByLabel("Reach Right").uncheck();
  await page.getByLabel("Duck").uncheck();
  await page.getByRole("button", { name: /Save game & calibrate/ }).click();
  await expect(page.getByText(/at least two supported movements/)).toBeVisible();
  await page.getByLabel("Reach Left").check();
  await page.getByRole("button", { name: /Save game & calibrate/ }).click();
  await expect(page).toHaveURL(/\/calibrate$/);

  const retained = await page.evaluate(() => ({
    blueprint: JSON.parse(localStorage.getItem("move-canvas:active-blueprint") ?? "null"),
    record: JSON.parse(localStorage.getItem("move-canvas:active-blueprint-record") ?? "null"),
  }));
  expect(retained.blueprint.title).toBe("Nora's Orbit Run");
  expect(retained.blueprint.gestures).toEqual(["freeze", "reach_left"]);
  expect(retained.record.provenance.sourcePrompt).toContain("space orchard");
  expect(retained.record.edits.map((edit: { field: string }) => edit.field)).toEqual(
    expect.arrayContaining(["title", "durationSeconds", "intensity", "gestures"]),
  );

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your games, ready when you are." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nora's Orbit Run" })).toBeVisible();
});

test("published library supports likes and adding a real blueprint to My Space", async ({
  page,
}) => {
  await mockCommunityBackend(page);
  await page.goto("/#library");
  await expect(
    page.getByRole("heading", { name: "Find your next living-room game." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Orbit Orchard" })).toBeVisible();

  const like = page.getByRole("button", { name: /Like Orbit Orchard/ });
  await expect(like).toContainText("3");
  await like.click();
  await expect(page.getByRole("button", { name: /Unlike Orbit Orchard/ })).toContainText("4");

  await page.getByRole("button", { name: "Add to My Space" }).click();
  await expect(page.getByText(/was added to My Space/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your games, ready when you are." }),
  ).toBeVisible();
  await expect(
    page.locator(".saved-game-card").getByRole("heading", { name: "Orbit Orchard" }),
  ).toBeVisible();

  const axe = await new AxeBuilder({ page }).analyze();
  expect(
    axe.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    ),
  ).toEqual([]);
});

test("public framing, route recovery, and persisted-data boundaries fail closed", async ({
  page,
}) => {
  const response = await page.goto("/coach");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["permissions-policy"]).toContain("camera=(self)");
  await expect(page).toHaveTitle("Choose a mode · Move Canvas");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /opengraph-image/,
  );
  await expect(page.locator("main#main")).toBeVisible();

  const robots = await page.request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /coach/controller");

  await page.goto("/missing-room-route");
  await expect(page.getByRole("heading", { name: /route is not available/i })).toBeVisible();
  await expect(page.locator("main#main")).toBeVisible();

  await page.addInitScript(() => {
    localStorage.setItem("move-canvas:active-blueprint", "{malformed");
    localStorage.setItem(
      "move-canvas:calibration",
      JSON.stringify({ version: "1.0", samples: { backflip: true } }),
    );
    localStorage.setItem(
      "move-canvas:player",
      JSON.stringify({ id: "bad", name: "x".repeat(80), color: "red" }),
    );
  });
  await page.goto("/pair");
  await expect(
    page.getByRole("heading", { name: "Create and calibrate a game first." }),
  ).toBeVisible();
  await expect(page.locator("main#main")).toBeVisible();
  await page.goto("/calibrate");
  await expect(
    page.getByRole("heading", { name: "Create a game before you calibrate." }),
  ).toBeVisible();
});

test("multiple phone controllers and a display complete a shared round", async ({ browser }) => {
  test.setTimeout(40_000);
  const controllerContext = await browser.newContext({ baseURL });
  const displayContext = await browser.newContext({ baseURL });
  const guestContext = await browser.newContext({ baseURL });
  const controller = await controllerContext.newPage();
  await controller.addInitScript((game) => {
    localStorage.setItem("move-canvas:active-blueprint", JSON.stringify(game));
    localStorage.setItem(
      "move-canvas:player",
      JSON.stringify({ id: "host-player", name: "Nora", color: "#C8FF54" }),
    );
  }, blueprint);
  await controller.goto("/pair");

  const displayHref = await controller
    .getByRole("link", { name: "Open display" })
    .getAttribute("href");
  expect(displayHref).toBeTruthy();
  const display = await displayContext.newPage();
  await display.goto(displayHref!);

  const code = displayHref!.split("/").at(-1)!;
  const guest = await guestContext.newPage();
  await guest.addInitScript(() => {
    localStorage.removeItem("move-canvas:active-blueprint");
    localStorage.setItem(
      "move-canvas:player",
      JSON.stringify({ id: "guest-player", name: "Sam", color: "#FF6B62" }),
    );
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
  await expect(display.getByRole("heading", { name: "Reach Right" })).toBeVisible();
  await guest.getByRole("button", { name: "Reach Right" }).click();
  await expect(display.getByText("Team 21")).toBeVisible();

  await expect(display.getByText("ROUND COMPLETE")).toBeVisible({ timeout: 20_000 });
  await expect(controller.getByRole("button", { name: "Play again" })).toBeVisible();
  const savedResult = await controller.evaluate(() =>
    localStorage.getItem("move-canvas:last-result"),
  );
  expect(savedResult).not.toBeNull();
  expect(JSON.parse(savedResult!).gameTitle).toBe("Orbit Orchard");
  await Promise.all([controllerContext.close(), displayContext.close(), guestContext.close()]);
});

test("controller and display have no serious axe violations and start by keyboard", async ({
  browser,
}) => {
  const controllerContext = await browser.newContext({ baseURL });
  const displayContext = await browser.newContext({ baseURL });
  const controller = await controllerContext.newPage();
  await controller.addInitScript((game) => {
    localStorage.setItem("move-canvas:active-blueprint", JSON.stringify(game));
  }, blueprint);
  await controller.goto("/pair");
  const displayHref = await controller
    .getByRole("link", { name: "Open display" })
    .getAttribute("href");
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
  const severe = [...controllerAxe.violations, ...displayAxe.violations].filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
  expect(severe).toEqual([]);
  await Promise.all([controllerContext.close(), displayContext.close()]);
});
