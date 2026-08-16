import { describe, expect, it } from "vitest";
import { can } from "./permissions";
describe("role permissions", () => {
  it("allows admin all closing capabilities", () => {
    expect(can("ADMIN", "closings:view")).toBe(true);
    expect(can("ADMIN", "closings:create")).toBe(true);
    expect(can("ADMIN", "closings:edit")).toBe(true);
    expect(can("ADMIN", "closings:crosscheck")).toBe(true);
    expect(can("ADMIN", "shipping-history:view")).toBe(true);
  });
  it("allows Sidoarjo to view/create/edit closing and edit packages", () => {
    expect(can("STAFF_SIDOARJO", "packages:edit")).toBe(true);
    expect(can("STAFF_SIDOARJO", "closings:view")).toBe(true);
    expect(can("STAFF_SIDOARJO", "closings:create")).toBe(true);
    expect(can("STAFF_SIDOARJO", "closings:edit")).toBe(true);
    expect(can("STAFF_SIDOARJO", "shipping-history:view")).toBe(true);
  });
  it("Sidoarjo cannot Merauke crosscheck", () => {
    expect(can("STAFF_SIDOARJO", "closings:crosscheck")).toBe(false);
  });
  it("allows Merauke staff to view and crosscheck closings", () => {
    expect(can("STAFF_MERAUKE", "closings:view")).toBe(true);
    expect(can("STAFF_MERAUKE", "closings:crosscheck")).toBe(true);
    expect(can("STAFF_MERAUKE", "shipping-history:view")).toBe(true);
  });
  it("Merauke staff cannot create/edit closing or edit packages", () => {
    expect(can("STAFF_MERAUKE", "closings:create")).toBe(false);
    expect(can("STAFF_MERAUKE", "closings:edit")).toBe(false);
    expect(can("STAFF_MERAUKE", "packages:edit")).toBe(false);
  });
  it("allows Merauke staff to reconcile arrivals", () =>
    expect(can("STAFF_MERAUKE", "packages:arrive")).toBe(true));
});