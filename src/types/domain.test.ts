import { describe, expect, it } from "vitest";
import { normalizeInternalRole } from "./domain";

describe("normalizeInternalRole", () => {
  it("maps the legacy OWNER role to ADMIN during migration rollout", () => {
    expect(normalizeInternalRole("OWNER")).toBe("ADMIN");
  });

  it("keeps supported roles and rejects unexpected roles", () => {
    expect(normalizeInternalRole("STAFF_SIDOARJO")).toBe("STAFF_SIDOARJO");
    expect(normalizeInternalRole("FINANCE")).toBeNull();
  });
});
