import { describe, expect, it } from "vitest";

import { hasPersistentMultiplePeople } from "./reference-extractor";

describe("reference extraction safeguards", () => {
  it("tolerates an isolated false-positive second pose", () => {
    expect(hasPersistentMultiplePeople(1, 101)).toBe(false);
    expect(hasPersistentMultiplePeople(2, 10)).toBe(false);
  });

  it("rejects references with a persistent second person", () => {
    expect(hasPersistentMultiplePeople(3, 10)).toBe(true);
    expect(hasPersistentMultiplePeople(16, 101)).toBe(true);
  });

  it("fails open only when no frames were sampled", () => {
    expect(hasPersistentMultiplePeople(0, 0)).toBe(false);
  });
});
