import { statusTextClass } from "./status-text";

const ACTIVE_SHIPPING = new Set(["FINALIZED", "IN_SHIPMENT", "ARRIVED"]);

export function closingCheckedCount(progress: string) {
  return Number(progress.split("/")[0]?.trim()) || 0;
}

export function closingStatusLabel(status: string, checkedCount: number) {
  if (ACTIVE_SHIPPING.has(status))
    return checkedCount > 0 ? "Finalisasi Merauke" : "Finalisasi Surabaya";
  if (status === "COMPLETED") return "Selesai";
  if (status === "CANCELLED") return "Dibatalkan";
  return status.replaceAll("_", " ");
}

export function closingStatusClass(status: string) {
  if (ACTIVE_SHIPPING.has(status)) return "status-text success";
  return statusTextClass(status);
}