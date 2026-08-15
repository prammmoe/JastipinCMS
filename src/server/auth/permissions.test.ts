import { describe, expect, it } from "vitest";
import { can } from "./permissions";
describe("role permissions", () => {
  it("prevents finance from receiving packages", () =>
    expect(can("FINANCE", "packages:receive")).toBe(false));
  it("allows Merauke staff to reconcile arrivals", () =>
    expect(can("STAFF_MERAUKE", "packages:arrive")).toBe(true));
});
