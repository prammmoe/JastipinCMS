import { describe, expect, it } from "vitest";
import {
  PACKAGE_LIST_STATUS_OPTIONS,
  packageListStatusLabel,
  packageStatusLabel,
} from "./package-status";

describe("package status labels", () => {
  it("maps intake statuses to operational labels", () => {
    expect(packageStatusLabel("WAITING_CLOSING")).toBe("Belum Closing");
    expect(packageStatusLabel("READY_TO_SHIP")).toBe("Closing Surabaya");
    expect(packageStatusLabel("IN_TRANSIT")).toBe("Dalam Pengiriman");
    expect(packageStatusLabel("ARRIVED_MERAUKE")).toBe("Closing Merauke");
    expect(packageStatusLabel("READY_FOR_PICKUP")).toBe("Siap Diambil");
    expect(packageStatusLabel("COMPLETED")).toBe("Selesai");
    expect(packageStatusLabel("DAMAGED")).toBe("Rusak");
    expect(packageStatusLabel("MISSING")).toBe("Hilang");
    expect(packageStatusLabel("HOLD")).toBe("Ditahan");
  });

  it("groups the package list into four business statuses", () => {
    expect(PACKAGE_LIST_STATUS_OPTIONS.map((option) => option.label)).toEqual([
      "Diterima",
      "Diterima Rusak",
      "Closing Surabaya",
      "Closing Merauke",
    ]);
    expect(packageListStatusLabel("WAITING_CLOSING")).toBe("Diterima");
    expect(packageListStatusLabel("IN_TRANSIT")).toBe("Closing Surabaya");
    expect(packageListStatusLabel("COMPLETED")).toBe("Closing Merauke");
  });
});
