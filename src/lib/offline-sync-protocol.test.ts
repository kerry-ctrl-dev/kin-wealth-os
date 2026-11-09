import { describe, expect, it } from "vitest";
import { isConflictResolution } from "./offline-sync-protocol";

describe("isConflictResolution", () => {
  it("accepts only supported conflict resolutions", () => {
    expect(["local", "server", "merge", "later"].every(isConflictResolution)).toBe(true);
    expect(isConflictResolution("toString")).toBe(false);
    expect(isConflictResolution("__proto__")).toBe(false);
    expect(isConflictResolution(null)).toBe(false);
  });
});
