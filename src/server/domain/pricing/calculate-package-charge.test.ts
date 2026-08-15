import { describe, expect, it } from "vitest";
import { calculatePackageCharge } from "./calculate-package-charge";
describe("calculatePackageCharge", () => {
  it("rounds weight up and applies rate", () => {
    expect(
      calculatePackageCharge({
        actualWeightKg: 1.2,
        chargeType: "WEIGHT",
        rateConfig: { ratePerKgIdr: 17000, roundingStepKg: 0.5 },
      }).amountIdr,
    ).toBe("25500");
  });
  it("uses volumetric weight when higher", () => {
    const result = calculatePackageCharge({
      actualWeightKg: 1,
      lengthCm: 60,
      widthCm: 40,
      heightCm: 30,
      chargeType: "VOLUMETRIC",
      rateConfig: {
        ratePerKgIdr: 10000,
        volumetricDivisor: 6000,
        roundingStepKg: 0.5,
      },
    });
    expect(result.chargeableWeightKg).toBe("12.000");
  });
  it("requires a manual override reason", () => {
    expect(() =>
      calculatePackageCharge({ chargeType: "MANUAL", manualAmountIdr: 10000 }),
    ).toThrow();
  });
});
