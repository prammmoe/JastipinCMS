export type InternalRole = "ADMIN" | "STAFF_SIDOARJO" | "STAFF_MERAUKE";

const INTERNAL_ROLES: readonly InternalRole[] = [
  "ADMIN",
  "STAFF_SIDOARJO",
  "STAFF_MERAUKE",
];

export type PackageChargeType = "WEIGHT" | "VOLUMETRIC" | "FIXED" | "MANUAL";

export type PackageStatus =
  | "WAITING_CLOSING"
  | "DAMAGED"
  | "READY_TO_SHIP"
  | "ARRIVED_MERAUKE";

export type Actor = {
  id: string;
  name: string;
  role: InternalRole;
};

export function normalizeInternalRole(role: string): InternalRole | null {
  if (!role) return null;
  const upper = role.toUpperCase();
  const normalized = upper === "OWNER" ? "ADMIN" : upper;
  return INTERNAL_ROLES.includes(normalized as InternalRole)
    ? (normalized as InternalRole)
    : null;
}

