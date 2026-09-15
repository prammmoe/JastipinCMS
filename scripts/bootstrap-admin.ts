import { randomUUID } from "node:crypto";
import { d1 } from "../src/server/d1/client";
import { hashPassword } from "../src/server/auth/passwords";

async function main() {
  const required = [
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "ADMIN_NAME",
  ] as const;
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing ${key}`);
  }
  await d1().execute(
    "INSERT INTO profiles(id,email,password_hash,name,role) VALUES(?,?,?,?,?) ON CONFLICT(email) DO NOTHING",
    [randomUUID(), process.env.ADMIN_EMAIL!.trim().toLowerCase(), await hashPassword(process.env.ADMIN_PASSWORD!), process.env.ADMIN_NAME!, "ADMIN"],
  );
  console.log(`Admin ensured: ${process.env.ADMIN_EMAIL}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Bootstrap Admin gagal.");
  process.exitCode = 1;
});
