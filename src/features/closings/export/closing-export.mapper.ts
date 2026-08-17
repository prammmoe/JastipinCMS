import type {
  ClosingExportData,
  ClosingExportItem,
} from "./closing-export.types";

export type ClosingPackageSource = {
  shipping_fee_snapshot_idr: string | number | null;
  chargeable_weight_snapshot_kg: number | null;
  packages: {
    id: string;
    tracking_number: string;
    shipping_fee_idr: number | null;
    customer_id: string | null;
    charge_type: string;
    length_cm: number | null;
    width_cm: number | null;
    height_cm: number | null;
    customers: { id: string; name: string } | null;
  };
};

export function indonesianDecimal(value: number): string {
  return String(value).replace(".", ",");
}

export function weightDisplay(source: ClosingPackageSource): string {
  const pkg = source.packages;
  const dimensional =
    pkg.charge_type === "VOLUMETRIC" &&
    pkg.length_cm != null &&
    pkg.width_cm != null &&
    pkg.height_cm != null;
  if (dimensional) {
    return [pkg.length_cm, pkg.width_cm, pkg.height_cm]
      .map((value) => indonesianDecimal(Number(value)))
      .join("x");
  }
  if (source.chargeable_weight_snapshot_kg == null) return "";
  return indonesianDecimal(Number(source.chargeable_weight_snapshot_kg));
}

export function mapClosingItem(
  source: ClosingPackageSource,
): ClosingExportItem {
  const customer = source.packages.customers;
  return {
    id: source.packages.id,
    customerId: customer?.id ?? source.packages.customer_id ?? null,
    customerName: customer?.name ?? "NO NAME",
    trackingNumber: source.packages.tracking_number,
    weightDisplay: weightDisplay(source),
    shippingCost: Number(
      source.shipping_fee_snapshot_idr ?? source.packages.shipping_fee_idr ?? 0,
    ),
  };
}

export function prepareClosingExportData(
  closing: { id: string; code: string; closing_date: string },
  rows: ClosingPackageSource[],
): ClosingExportData {
  return {
    id: closing.id,
    code: closing.code,
    closingDate: closing.closing_date,
    items: rows.map(mapClosingItem),
  };
}