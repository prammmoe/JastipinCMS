import type { PackageChargeType } from "@/types/domain";
export type RateConfig = { id?: string; name?: string; ratePerKgIdr?: string | number; minimumChargeIdr?: string | number; volumetricDivisor?: string | number; roundingStepKg?: string | number };
export type CalculatePackageChargeInput = { actualWeightKg?: number; lengthCm?: number; widthCm?: number; heightCm?: number; chargeType: PackageChargeType; rateConfig?: RateConfig; manualAmountIdr?: number; overrideReason?: string };

