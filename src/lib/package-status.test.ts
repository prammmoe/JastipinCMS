import { describe, expect, it } from "vitest";
import { packageStatusLabel } from "./package-status";

describe("package status labels", () => {
  it("maps intake statuses to operational labels", () => {
    expect(packageStatusLabel("WAITING_CLOSING")).toBe("Diterima");
    expect(packageStatusLabel("DAMAGED")).toBe("Diterima Rusak");
  });
});
