import "server-only";

const statusByCode: Record<string, number> = {
  AUTH_INVALID_CREDENTIALS: 401, AUTH_REQUIRED: 401, AUTH_FORBIDDEN: 403,
  AUTH_USER_DISABLED: 403, VALIDATION_ERROR: 400, NOT_FOUND: 404,
  CUSTOMER_NOT_FOUND: 404, CUSTOMER_INACTIVE: 409, CUSTOMER_NAME_EXISTS: 409,
  PACKAGE_NOT_FOUND: 404, CLOSING_NOT_FOUND: 404,
  SHIPMENT_NOT_FOUND: 404, PACKAGE_DUPLICATE_TRACKING: 409,
  PACKAGE_NOT_ELIGIBLE_FOR_CLOSING: 409, CLOSING_ALREADY_FINALIZED: 409,
  CLOSING_EMPTY: 400, CLOSING_DUPLICATE_PACKAGE: 409,
  PACKAGE_ALREADY_IN_CLOSING: 409, CLOSING_NOT_CHECKABLE: 409,
  CROSSCHECK_EMPTY: 400, PACKAGE_NOT_CHECKABLE: 409,
  PACKAGE_NOT_IN_SHIPPING: 409, INVALID_CONDITION: 400,
  SHIPMENT_NOT_DEPARTABLE: 409, PACKAGE_NOT_IN_SHIPMENT: 409,
  ARRIVAL_ALREADY_SCANNED: 409, PAYMENT_EXCEEDS_BALANCE: 409,
  PICKUP_PACKAGE_NOT_READY: 409, CSRF_ORIGIN_INVALID: 403, LOGIN_RATE_LIMITED: 429,
  PACKAGE_ATTACHMENT_LIMIT: 409,
  PACKAGE_EDIT_LOCKED: 409,
};

export class AppError extends Error {
  constructor(public readonly code: string, message: string, public readonly details?: unknown, public readonly status = statusByCode[code] ?? 400) { super(message); }
}

const messages: Record<string, string> = {
  PACKAGE_NOT_ELIGIBLE_FOR_CLOSING: "Ada paket yang belum siap untuk closing.",
  CLOSING_ALREADY_FINALIZED: "Closing sudah difinalisasi.",
  CLOSING_EMPTY: "Pilih minimal satu paket untuk closing.",
  CLOSING_DUPLICATE_PACKAGE: "Ada paket yang terpilih dua kali.",
  PACKAGE_ALREADY_IN_CLOSING: "Ada paket yang sudah berada di closing lain.",
  CLOSING_NOT_CHECKABLE: "Closing ini tidak dapat dicek Merauke.",
  CROSSCHECK_EMPTY: "Pilih minimal satu paket untuk dicek.",
  PACKAGE_NOT_CHECKABLE: "Ada paket yang tidak dalam status menunggu cek.",
  PACKAGE_NOT_IN_SHIPPING: "Ada paket yang belum dikirim.",
  INVALID_CONDITION: "Kondisi cek Merauke tidak valid.",
};

export function mapDatabaseError(error: { message?: string; code?: string } | null): never {
  const raw = error?.message ?? "DATABASE_OPERATION_FAILED";
  const known = [
    "PACKAGE_NOT_ELIGIBLE_FOR_CLOSING", "CLOSING_NOT_DRAFT", "CLOSING_HAS_PAYMENTS",
    "SHIPMENT_NOT_DEPARTABLE", "SHIPMENT_NOT_RECONCILABLE", "MISSING_CONFIRMATION_REQUIRED",
    "PAYMENT_EXCEEDS_BALANCE", "PICKUP_PACKAGE_NOT_READY", "PICKUP_EMPTY",
    "PACKAGE_ATTACHMENT_LIMIT", "CLOSING_EMPTY", "CLOSING_DUPLICATE_PACKAGE",
    "PACKAGE_ALREADY_IN_CLOSING", "CLOSING_NOT_CHECKABLE", "CROSSCHECK_EMPTY",
    "PACKAGE_NOT_CHECKABLE", "PACKAGE_NOT_IN_SHIPPING", "INVALID_CONDITION",
  ];
  const code = known.find((candidate) => raw.includes(candidate)) ?? "DATABASE_OPERATION_FAILED";
  throw new AppError(
    code,
    messages[code] ?? "Operasi tidak dapat diselesaikan.",
    undefined,
    code === "DATABASE_OPERATION_FAILED" ? 500 : 409,
  );
}
