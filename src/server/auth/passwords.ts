import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const options = { N: 32_768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const scrypt = (password: string, salt: string, length: number) => new Promise<Buffer>((resolve, reject) => {
  scryptCallback(password, salt, length, options, (error, key) => error ? reject(error) : resolve(key));
});

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${hash.toString("base64url")}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const [kind, salt, value] = encoded.split("$");
  if (kind !== "scrypt" || !salt || !value) return false;
  const expected = Buffer.from(value, "base64url");
  const actual = await scrypt(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
