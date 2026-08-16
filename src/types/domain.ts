export type InternalRole = "ADMIN" | "STAFF_SIDOARJO" | "STAFF_MERAUKE";
const INTERNAL_ROLES: InternalRole[] = [
  "ADMIN",
  "STAFF_SIDOARJO",
  "STAFF_MERAUKE",
];

export function normalizeInternalRole(role: string): InternalRole | null {
  const normalized = role === "OWNER" ? "ADMIN" : role;
  return INTERNAL_ROLES.includes(normalized as InternalRole)
    ? (normalized as InternalRole)
    : null;
}
export type PackageChargeType = "WEIGHT" | "VOLUMETRIC" | "FIXED" | "MANUAL";
export type PackageStatus =
  | "WAITING_CLOSING"
  | "READY_TO_SHIP"
  | "IN_TRANSIT"
  | "ARRIVED_MERAUKE"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "HOLD"
  | "DAMAGED"
  | "MISSING";

export type Actor = { id: string; name: string; role: InternalRole };
export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
