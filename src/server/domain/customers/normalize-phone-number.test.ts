import { describe, expect, it } from "vitest";
import {
  isValidPhoneNumber,
  normalizePhoneNumber,
} from "./normalize-phone-number";

describe("normalizePhoneNumber", () => {
  it("normalizes +628... to 08...", () => {
    expect(normalizePhoneNumber("+6281247016022")).toBe("081247016022");
  });

  it("normalizes 628... to 08...", () => {
    expect(normalizePhoneNumber("6281247016022")).toBe("081247016022");
  });

  it("keeps 08... as is", () => {
    expect(normalizePhoneNumber("081247016022")).toBe("081247016022");
  });

  it("cleans spaces and hyphens", () => {
    expect(normalizePhoneNumber("+62 812-4701-6022")).toBe("081247016022");
    expect(normalizePhoneNumber("0812 4701 6022")).toBe("081247016022");
  });

  it("returns null for empty or null inputs", () => {
    expect(normalizePhoneNumber("")).toBeNull();
    expect(normalizePhoneNumber("   ")).toBeNull();
    expect(normalizePhoneNumber(null)).toBeNull();
    expect(normalizePhoneNumber(undefined)).toBeNull();
  });

  it("returns null for non-digit or invalid prefix inputs", () => {
    expect(normalizePhoneNumber("sddsodsidsk")).toBeNull();
    expect(normalizePhoneNumber("1234567890")).toBeNull();
    expect(normalizePhoneNumber("0211234567")).toBeNull();
  });

  it("returns null for too short or too long numbers", () => {
    expect(normalizePhoneNumber("08123")).toBeNull();
    expect(normalizePhoneNumber("081234567890123456")).toBeNull();
  });
});

describe("isValidPhoneNumber", () => {
  it("validates phone numbers correctly", () => {
    expect(isValidPhoneNumber("+6281247016022")).toBe(true);
    expect(isValidPhoneNumber("081247016022")).toBe(true);
    expect(isValidPhoneNumber("")).toBe(true); // optional
    expect(isValidPhoneNumber("sddsodsidsk")).toBe(false);
  });
});
