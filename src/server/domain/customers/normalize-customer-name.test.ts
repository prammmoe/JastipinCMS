import { describe, expect, it } from "vitest";
import {
  cleanCustomerName,
  customerDisplayName,
  normalizeCustomerName,
} from "./normalize-customer-name";

describe("customer name normalization", () => {
  it("collapses whitespace while preserving display capitalization", () => {
    expect(cleanCustomerName("  Siti   Nurhaliza ")).toBe("Siti Nurhaliza");
  });

  it("matches names regardless of case and repeated whitespace", () => {
    expect(normalizeCustomerName("  SITI   Nurhaliza ")).toBe(
      "siti nurhaliza",
    );
  });

  it("uses NONAME when the customer name is empty", () => {
    expect(customerDisplayName()).toBe("NONAME");
    expect(customerDisplayName("   ")).toBe("NONAME");
  });

  it("keeps a cleaned customer name when one is provided", () => {
    expect(customerDisplayName("  Siti   Nurhaliza ")).toBe(
      "Siti Nurhaliza",
    );
  });
});
