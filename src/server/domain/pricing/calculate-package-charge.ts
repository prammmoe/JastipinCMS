import Decimal from "decimal.js";
import { AppError } from "@/server/errors/app-error";
import type { CalculatePackageChargeInput } from "./types";

const d = (value?: string | number) => new Decimal(value ?? 0);
export function calculatePackageCharge(input: CalculatePackageChargeInput) {
  const actual = d(input.actualWeightKg);
  const divisor = d(input.rateConfig?.volumetricDivisor || 6000);
  const hasDimensions = [input.lengthCm, input.widthCm, input.heightCm].every(
    (value) => value != null && value > 0,
  );
  const volumetric = hasDimensions
    ? d(input.lengthCm)
        .mul(d(input.widthCm))
        .mul(d(input.heightCm))
        .div(divisor)
    : d(0);
  const step = d(input.rateConfig?.roundingStepKg || 0.5);
  const roundUp = (value: Decimal) => value.div(step).ceil().mul(step);
  let chargeable =
    input.chargeType === "VOLUMETRIC"
      ? Decimal.max(actual, volumetric)
      : actual;
  let amount = d(0);
  if (["WEIGHT", "VOLUMETRIC"].includes(input.chargeType)) {
    if (!input.rateConfig?.ratePerKgIdr || chargeable.lte(0))
      throw new AppError(
        "PRICING_INPUT_INVALID",
        "Berat dan tarif wajib diisi.",
      );
    chargeable = roundUp(chargeable);
    amount = Decimal.max(
      chargeable.mul(d(input.rateConfig.ratePerKgIdr)),
      d(input.rateConfig.minimumChargeIdr),
    );
  } else {
    if (input.manualAmountIdr == null || input.manualAmountIdr < 0)
      throw new AppError("PRICING_INPUT_INVALID", "Nominal wajib diisi.");
    if (input.chargeType === "MANUAL" && !input.overrideReason?.trim())
      throw new AppError(
        "MANUAL_OVERRIDE_REASON_REQUIRED",
        "Alasan harga manual wajib diisi.",
      );
    amount = d(input.manualAmountIdr);
  }
  return {
    actualWeightKg: actual.gt(0) ? actual.toFixed(3) : null,
    volumetricWeightKg: volumetric.gt(0)
      ? volumetric.toDecimalPlaces(3, Decimal.ROUND_HALF_UP).toFixed(3)
      : null,
    chargeableWeightKg: chargeable.gt(0) ? chargeable.toFixed(3) : null,
    amountIdr: amount.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0),
    chargeType: input.chargeType,
    pricingSnapshot: {
      version: 1,
      calculatedAt: new Date().toISOString(),
      input,
      rateConfig: input.rateConfig ?? null,
      volumetricWeightKg: volumetric.toString(),
      chargeableWeightKg: chargeable.toString(),
      amountIdr: amount.toFixed(0),
    },
  };
}
