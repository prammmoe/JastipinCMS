import "server-only";
import { z } from "zod";
import type { NextRequest } from "next/server";
import { d1 } from "@/server/d1/client";
import { hashPassword, verifyPassword } from "@/server/auth/passwords";
import { AppError } from "@/server/errors/app-error";
import { ok } from "@/server/api/response";
import type { Actor } from "@/types/domain";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10).max(128),
});

export async function changePassword(
  request: NextRequest,
  method: string,
  actor: Actor,
) {
  if (method !== "POST")
    throw new AppError("NOT_FOUND", "Endpoint tidak ditemukan.", undefined, 404);
  const input = schema.parse(await request.json().catch(() => ({})));
  const db = d1();
  const user = await db.one<{ password_hash: string }>("SELECT password_hash FROM profiles WHERE id=?", [actor.id]);
  if (!user || !(await verifyPassword(input.currentPassword, user.password_hash)))
    throw new AppError("AUTH_INVALID_CREDENTIALS", "Password saat ini salah.");
  await db.batch([{ sql: "UPDATE profiles SET password_hash=? WHERE id=?", params: [await hashPassword(input.newPassword), actor.id] }, { sql: "DELETE FROM sessions WHERE profile_id=?", params: [actor.id] }]);
  return ok({ updated: true });
}
