import { describe, expect, it } from "vitest";
import {
  cleanCustomerName,
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
});
