import { describe, expect, it } from "vitest";
import { normalizeInternalRole } from "./domain";

describe("normalizeInternalRole", () => {
  it("maps the legacy OWNER role to ADMIN during migration rollout", () => {
    expect(normalizeInternalRole("OWNER")).toBe("ADMIN");
    expect(normalizeInternalRole("owner")).toBe("ADMIN");
  });

  it("keeps supported roles and rejects unexpected roles", () => {
    expect(normalizeInternalRole("ADMIN")).toBe("ADMIN");
    expect(normalizeInternalRole("STAFF_SIDOARJO")).toBe("STAFF_SIDOARJO");
    expect(normalizeInternalRole("STAFF_MERAUKE")).toBe("STAFF_MERAUKE");
    expect(normalizeInternalRole("FINANCE")).toBeNull();
    expect(normalizeInternalRole("INVALID_ROLE")).toBeNull();
  });
});
