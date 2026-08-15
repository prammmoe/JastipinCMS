export function cleanCustomerName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeCustomerName(value: string) {
  return cleanCustomerName(value).toLowerCase();
}
