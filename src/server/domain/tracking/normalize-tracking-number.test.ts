import { describe, expect, it } from "vitest";
import { normalizeTrackingNumber } from "./normalize-tracking-number";
describe("normalizeTrackingNumber", () => { it("normalizes case and formatting separators", () => { expect(normalizeTrackingNumber(" SPXID-068 956/315.677 ")).toBe("SPXID068956315677"); }); });

