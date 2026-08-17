const SUCCESS = new Set(["READY_TO_SHIP", "ARRIVED_MERAUKE"]);
const WARNING = new Set(["DAMAGED"]);

export function statusTextClass(status: string) {
  const normalized = status.toUpperCase().replaceAll(" ", "_");
  if (SUCCESS.has(normalized)) return "status-text success";
  if (WARNING.has(normalized)) return "status-text warning";
  return "status-text";
}