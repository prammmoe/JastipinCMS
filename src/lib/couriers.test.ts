import { describe, expect, it } from "vitest";
import { filterCouriers, matchCourier } from "./couriers";

describe("courier matching", () => {
  it("canonicalizes case, spacing, and punctuation", () => {
    expect(matchCourier("jne")).toBe("JNE");
    expect(matchCourier("j t")).toBe("J&T");
    expect(matchCourier(" ninja-xpress ")).toBe("Ninja Xpress");
  });

  it("keeps unmatched free text available", () => {
    expect(matchCourier("Kurir Lokal Merauke")).toBeUndefined();
    expect(filterCouriers("kurir lokal")).toEqual([]);
  });

  it("filters the dropdown without requiring an exact match", () => {
    expect(filterCouriers("logistik")).toEqual([
      "Indah Logistik",
      "KAI Logistik",
    ]);
  });
});
