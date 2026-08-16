import type { PackageStatus } from "@/types/domain";

export const PACKAGE_STATUS_LABELS: Record<PackageStatus, string> = {
  WAITING_CLOSING: "Diterima",
  DAMAGED: "Diterima Rusak",
  READY_TO_SHIP: "Siap Dikirim",
  IN_TRANSIT: "Dalam Pengiriman",
  ARRIVED_MERAUKE: "Tiba di Merauke",
  READY_FOR_PICKUP: "Siap Diambil",
  COMPLETED: "Selesai",
  HOLD: "Ditahan",
  MISSING: "Hilang",
};

export const PACKAGE_STATUSES = Object.keys(
  PACKAGE_STATUS_LABELS,
) as PackageStatus[];

export function packageStatusLabel(status: string) {
  return PACKAGE_STATUS_LABELS[status as PackageStatus] ?? status.replaceAll("_", " ");
}
