import { describe, expect, it } from "vitest";
import { packageIntakeSchema, packageListSchema } from "./schemas";

const validIntake = {
  trackingNumber: "JNE-123",
  customerName: "Budi",
  receivedDate: "2026-08-16",
  receivedTime: null,
  actualWeightKg: 1.25,
  chargeType: "FIXED" as const,
  manualAmountIdr: 10000,
  receivingCondition: "RECEIVED" as const,
};

describe("packageIntakeSchema", () => {
  it("accepts a required intake with an omitted time", () => {
    expect(packageIntakeSchema.parse(validIntake).receivedTime).toBeNull();
  });

  it.each([
    ["receivedDate", ""],
    ["trackingNumber", ""],
    ["actualWeightKg", 0],
    ["manualAmountIdr", 0],
  ])("rejects invalid %s", (field, value) => {
    expect(() => packageIntakeSchema.parse({ ...validIntake, [field]: value })).toThrow();
  });

  it("requires either an existing customer or a customer name", () => {
    expect(() => packageIntakeSchema.parse({ ...validIntake, customerName: "" })).toThrow("Customer wajib diisi");
  });

  it("preserves a supplied reception time", () => {
    expect(packageIntakeSchema.parse({ ...validIntake, receivedTime: "14:35" }).receivedTime).toBe("14:35");
  });

  it("accepts an optional customer phone number", () => {
    expect(
      packageIntakeSchema.parse({ ...validIntake, customerPhone: "0812 3456 7890" })
        .customerPhone,
    ).toBe("0812 3456 7890");
    expect(packageIntakeSchema.parse(validIntake).customerPhone).toBeUndefined();
  });

  it("rejects a customer phone number longer than 30 characters", () => {
    expect(() =>
      packageIntakeSchema.parse({ ...validIntake, customerPhone: "1".repeat(31) }),
    ).toThrow();
  });
});

describe("packageListSchema", () => {
  it.each(["received_desc", "received_asc", "fee_desc", "fee_asc"])(
    "allows sort %s",
    (sort) => expect(packageListSchema.parse({ sort }).sort).toBe(sort),
  );

  it("rejects an unrecognized status and sort", () => {
    expect(() => packageListSchema.parse({ status: "UNKNOWN" })).toThrow();
    expect(() => packageListSchema.parse({ sort: "random" })).toThrow();
  });
});
