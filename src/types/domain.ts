export type PackageStatus =
  | "WAITING_CLOSING"
  | "DAMAGED"
  | "READY_TO_SHIP"
  | "ARRIVED_MERAUKE";

export type Actor = {
  id: string;
  name: string;
  role: string;
};

export function normalizeInternalRole(role: string): string | null {
  const lower = role.toUpperCase();
  if (lower === "OWNER") return "ADMIN";
  if (lower === "STAFF_SIDOARJO") return "STAFF_SIDOARJO";
  if (lower === "FINANCE") return null;
  return null;
}
