export const DEFAULT_CUSTOMER_NAME = "NONAME";

export function cleanCustomerName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function customerDisplayName(value?: string | null) {
  return cleanCustomerName(value ?? "") || DEFAULT_CUSTOMER_NAME;
}

export function normalizeCustomerName(value: string) {
  return cleanCustomerName(value).toLowerCase();
}
