export function normalizePhoneNumber(phone?: string | null): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;

  const cleaned = trimmed.replace(/[\s\-\.\(\)]/g, "");

  let normalized = cleaned;
  if (normalized.startsWith("+628")) {
    normalized = "08" + normalized.slice(4);
  } else if (normalized.startsWith("+62")) {
    normalized = "0" + normalized.slice(3);
  } else if (normalized.startsWith("628")) {
    normalized = "08" + normalized.slice(3);
  } else if (normalized.startsWith("62")) {
    normalized = "0" + normalized.slice(2);
  }

  if (/^08\d{8,13}$/.test(normalized)) {
    return normalized;
  }

  return null;
}

export function isValidPhoneNumber(phone?: string | null): boolean {
  if (!phone || !phone.trim()) return true;
  return normalizePhoneNumber(phone) !== null;
}
