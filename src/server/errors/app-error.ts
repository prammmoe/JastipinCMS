import "server-only";

const statusByCode: Record<string, number> = {
  AUTH_INVALID_CREDENTIALS: 401, AUTH_REQUIRED: 401, AUTH_FORBIDDEN: 403,
  AUTH_USER_DISABLED: 403, VALIDATION_ERROR: 400, NOT_FOUND: 404,
  CUSTOMER_NOT_FOUND: 404, CUSTOMER_INACTIVE: 409, CUSTOMER_NAME_EXISTS: 409,
  PACKAGE_NOT_FOUND: 404, CLOSING_NOT_FOUND: 404,
  SHIPMENT_NOT_FOUND: 404, PACKAGE_DUPLICATE_TRACKING: 409,
  PACKAGE_NOT_ELIGIBLE_FOR_CLOSING: 409, CLOSING_ALREADY_FINALIZED: 409,
  SHIPMENT_NOT_DEPARTABLE: 409, PACKAGE_NOT_IN_SHIPMENT: 409,
  ARRIVAL_ALREADY_SCANNED: 409, PAYMENT_EXCEEDS_BALANCE: 409,
  PICKUP_PACKAGE_NOT_READY: 409, CSRF_ORIGIN_INVALID: 403, LOGIN_RATE_LIMITED: 429,
};

export class AppError extends Error {
  constructor(public readonly code: string, message: string, public readonly details?: unknown, public readonly status = statusByCode[code] ?? 400) { super(message); }
}

export function mapDatabaseError(error: { message?: string; code?: string } | null): never {
  const raw = error?.message ?? "DATABASE_OPERATION_FAILED";
  const known = ["PACKAGE_NOT_ELIGIBLE_FOR_CLOSING","CLOSING_NOT_DRAFT","CLOSING_HAS_PAYMENTS","SHIPMENT_NOT_DEPARTABLE","SHIPMENT_NOT_RECONCILABLE","MISSING_CONFIRMATION_REQUIRED","PAYMENT_EXCEEDS_BALANCE","PICKUP_PACKAGE_NOT_READY","PICKUP_EMPTY"];
  const code = known.find((candidate) => raw.includes(candidate)) ?? "DATABASE_OPERATION_FAILED";
  throw new AppError(code, "Operasi tidak dapat diselesaikan.", undefined, code === "DATABASE_OPERATION_FAILED" ? 500 : 409);
}
