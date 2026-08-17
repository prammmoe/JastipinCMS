import type { PackageStatus } from "@/types/domain";

export const PACKAGE_STATUS_LABELS: Record<PackageStatus, string> = {
  WAITING_CLOSING: "Diterima",
  DAMAGED: "Diterima Rusak",
  READY_TO_SHIP: "Closing Surabaya",
  ARRIVED_MERAUKE: "Closing Merauke",
};

export const PACKAGE_STATUSES = Object.keys(
  PACKAGE_STATUS_LABELS,
) as PackageStatus[];

export const PACKAGE_LIST_STATUS_OPTIONS = [
  { value: "WAITING_CLOSING", label: "Diterima" },
  { value: "DAMAGED", label: "Diterima Rusak" },
  { value: "READY_TO_SHIP", label: "Closing Surabaya" },
  { value: "ARRIVED_MERAUKE", label: "Closing Merauke" },
] as const;

export function packageStatusLabel(status: string) {
  return PACKAGE_STATUS_LABELS[status as PackageStatus] ?? status.replaceAll("_", " ");
}

export function packageListStatusLabel(status: string) {
  return PACKAGE_STATUS_LABELS[status as PackageStatus] ?? status.replaceAll("_", " ");
}

export function packageReceivedLabel(status: string) {
  return status === "DAMAGED" ? "Diterima Rusak" : "Diterima";
}

export function packageReceivedClass(status: string) {
  return status === "DAMAGED" ? "status-text warning" : "status-text success";
}