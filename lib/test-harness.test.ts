import { afterEach, describe, expect, it, vi } from "vitest";
import { coachTestHarnessEnabled } from "./test-harness";

describe("coach test harness boundary", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is available only in an explicitly enabled non-production process", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("MOVE_CANVAS_E2E", "1");
    expect(coachTestHarnessEnabled()).toBe(true);
  });

  it("fails closed in production even if the test flag is accidentally present", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MOVE_CANVAS_E2E", "1");
    expect(coachTestHarnessEnabled()).toBe(false);
  });
});
