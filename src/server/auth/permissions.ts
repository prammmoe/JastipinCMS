import "server-only";
import type { InternalRole } from "@/types/domain";

export type Capability =
  | "dashboard:view"
  | "customers:manage"
  | "packages:view"
  | "packages:receive"
  | "packages:edit"
  | "packages:arrive"
  | "closings:manage"
  | "shipments:manage"
  | "pickups:manage"
  | "invoices:view"
  | "payments:manage"
  | "expenses:manage"
  | "reports:view"
  | "settings:manage";
const matrix: Record<InternalRole, Capability[]> = {
  ADMIN: [
    "dashboard:view",
    "customers:manage",
    "packages:view",
    "packages:receive",
    "packages:edit",
    "packages:arrive",
    "closings:manage",
    "shipments:manage",
    "pickups:manage",
    "invoices:view",
    "payments:manage",
    "expenses:manage",
    "reports:view",
    "settings:manage",
  ],
  STAFF_SIDOARJO: [
    "dashboard:view",
    "customers:manage",
    "packages:view",
    "packages:receive",
    "closings:manage",
    "shipments:manage",
    "invoices:view",
    "reports:view",
  ],
  STAFF_MERAUKE: [
    "dashboard:view",
    "customers:manage",
    "packages:view",
    "packages:arrive",
    "shipments:manage",
    "pickups:manage",
    "invoices:view",
    "reports:view",
  ],
};

export const can = (role: InternalRole, capability: Capability) =>
  matrix[role]?.includes(capability) ?? false;
