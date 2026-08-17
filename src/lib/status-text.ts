const SUCCESS = new Set([
  "COMPLETED",
  "READY_FOR_PICKUP",
  "ARRIVED_MERAUKE",
  "ARRIVED",
  "RECONCILED",
  "FINALIZED",
  "PAID",
  "ACTIVE",
]);

const WARNING = new Set([
  "DAMAGED",
  "HOLD",
  "IN_TRANSIT",
  "IN_SHIPMENT",
  "PARTIAL",
  "READY",
  "DEPARTED",
  "WAITING_CLOSING",
]);

const DANGER = new Set([
  "MISSING",
  "CANCELLED",
  "VOID",
  "UNPAID",
  "INACTIVE",
]);

export function statusTextClass(status: string) {
  const normalized = status.toUpperCase().replaceAll(" ", "_");
  if (SUCCESS.has(normalized)) return "status-text success";
  if (WARNING.has(normalized)) return "status-text warning";
  if (DANGER.has(normalized)) return "status-text danger";
  return "status-text";
}
