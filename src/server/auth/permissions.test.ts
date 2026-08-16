import { describe, expect, it } from "vitest";
import { can } from "./permissions";
describe("role permissions", () => {
  it("allows only admin to edit packages", () => {
    expect(can("ADMIN", "packages:edit")).toBe(true);
    expect(can("STAFF_SIDOARJO", "packages:edit")).toBe(false);
  });
  it("allows Merauke staff to reconcile arrivals", () =>
    expect(can("STAFF_MERAUKE", "packages:arrive")).toBe(true));
});
