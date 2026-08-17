import "server-only";
import { z } from "zod";
import type { NextRequest } from "next/server";
import { createAdminClient, createAuthClient } from "@/server/supabase/clients";
import { AppError, mapDatabaseError } from "@/server/errors/app-error";
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
  const admin = createAdminClient();
  const { data: authUser, error: getUserError } =
    await admin.auth.admin.getUserById(actor.id);
  const email = authUser?.user?.email;
  if (getUserError || !email)
    throw new AppError("AUTH_USER_NOT_FOUND", "Akun pengguna tidak ditemukan.");
  const verify = await createAuthClient().auth.signInWithPassword({
    email,
    password: input.currentPassword,
  });
  if (verify.error)
    throw new AppError("AUTH_INVALID_CREDENTIALS", "Password saat ini salah.");
  const update = await admin.auth.admin.updateUserById(actor.id, {
    password: input.newPassword,
  });
  if (update.error) mapDatabaseError(update.error);
  await admin.from("audit_logs").insert({
    actor_id: actor.id,
    action: "PASSWORD_CHANGED",
    entity_type: "USER",
    entity_id: actor.id,
  });
  return ok({ updated: true });
}