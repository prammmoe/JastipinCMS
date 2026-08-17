import "server-only";
import type { InternalRole } from "@/types/domain";

export type Capability =
  | "dashboard:view"
  | "customers:manage"
  | "packages:view"
  | "packages:receive"
  | "packages:edit"
  | "packages:arrive"
  | "closings:view"
  | "closings:create"
  | "closings:edit"
  | "closings:crosscheck"
  | "shipping-history:view"
  | "shipments:manage"
  | "pickups:manage"
  | "invoices:view"
  | "payments:manage"
  | "expenses:manage"
  | "reports:view"
  | "settings:manage"
  | "account:manage";
const matrix: Record<InternalRole, Capability[]> = {
  ADMIN: [
    "dashboard:view",
    "customers:manage",
    "packages:view",
    "packages:receive",
    "packages:edit",
    "packages:arrive",
    "closings:view",
    "closings:create",
    "closings:edit",
    "closings:crosscheck",
    "shipping-history:view",
    "shipments:manage",
    "pickups:manage",
    "invoices:view",
    "payments:manage",
    "expenses:manage",
    "reports:view",
    "settings:manage",
    "account:manage",
  ],
  STAFF_SIDOARJO: [
    "dashboard:view",
    "customers:manage",
    "packages:view",
    "packages:receive",
    "packages:edit",
    "closings:view",
    "closings:create",
    "closings:edit",
    "shipping-history:view",
    "shipments:manage",
    "invoices:view",
    "reports:view",
    "account:manage",
  ],
  STAFF_MERAUKE: [
    "dashboard:view",
    "customers:manage",
    "packages:view",
    "packages:arrive",
    "closings:view",
    "closings:crosscheck",
    "shipping-history:view",
    "pickups:manage",
    "invoices:view",
    "reports:view",
    "account:manage",
  ],
};

export const can = (role: InternalRole, capability: Capability) =>
  matrix[role]?.includes(capability) ?? false;