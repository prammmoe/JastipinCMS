export function normalizeTrackingNumber(value: string) {
  return value.trim().toUpperCase().replace(/[\s\-_./]+/g, "");
}

