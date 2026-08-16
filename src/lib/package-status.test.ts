import { describe, expect, it } from "vitest";
import { packageStatusLabel } from "./package-status";

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
});