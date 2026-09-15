import "server-only";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const options = { N: 32_768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = await (scrypt as any)(password, salt, 64, options) as Buffer;
  return `scrypt$${salt}$${hash.toString("base64url")}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const [kind, salt, value] = encoded.split("$");
  if (kind !== "scrypt" || !salt || !value) return false;
  const expected = Buffer.from(value, "base64url");
  const actual = await (scrypt as any)(password, salt, expected.length, options) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
