import { describe, expect, it } from "vitest";
import {
  PACKAGE_LIST_STATUS_OPTIONS,
  packageListStatusLabel,
  packageStatusLabel,
} from "./package-status";

describe("package status labels", () => {
  it("maps intake statuses to operational labels", () => {
    expect(packageStatusLabel("WAITING_CLOSING")).toBe("Diterima");
    expect(packageStatusLabel("DAMAGED")).toBe("Diterima Rusak");
    expect(packageStatusLabel("READY_TO_SHIP")).toBe("Closing Surabaya");
    expect(packageStatusLabel("ARRIVED_MERAUKE")).toBe("Closing Merauke");
  });

  it("groups the package list into four business statuses", () => {
    expect(PACKAGE_LIST_STATUS_OPTIONS.map((option) => option.label)).toEqual([
      "Diterima",
      "Diterima Rusak",
      "Closing Surabaya",
      "Closing Merauke",
    ]);
    expect(packageListStatusLabel("WAITING_CLOSING")).toBe("Diterima");
    expect(packageListStatusLabel("DAMAGED")).toBe("Diterima Rusak");
    expect(packageListStatusLabel("READY_TO_SHIP")).toBe("Closing Surabaya");
    expect(packageListStatusLabel("ARRIVED_MERAUKE")).toBe("Closing Merauke");
  });
});
