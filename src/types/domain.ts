export type InternalRole =
  | "OWNER"
  | "STAFF_SIDOARJO"
  | "STAFF_MERAUKE"
  | "FINANCE";
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
