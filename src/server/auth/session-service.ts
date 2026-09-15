import "server-only";
import { createHash } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { d1 } from "@/server/d1/client";
import { env } from "@/server/env";
import { AppError } from "@/server/errors/app-error";
import { normalizeInternalRole, type Actor } from "@/types/domain";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");
export type ResolvedSession = { actor: Actor; token?: string; expiresIn?: number };
export class SessionService {
  async resolve(request: NextRequest): Promise<ResolvedSession> {
    const token = request.cookies.get(env().AUTH_SESSION_COOKIE_NAME)?.value;
    if (!token) throw new AppError("AUTH_REQUIRED", "Silakan masuk terlebih dahulu.");
    const row = await d1().one<{ id: string; name: string; role: string; is_active: number }>("SELECT p.id,p.name,p.role,p.is_active FROM sessions s JOIN profiles p ON p.id=s.profile_id WHERE s.token_hash=? AND s.expires_at>?", [hash(token), new Date().toISOString()]);
    if (!row) throw new AppError("AUTH_REQUIRED", "Sesi telah berakhir.");
    if (!row.is_active) throw new AppError("AUTH_USER_DISABLED", "Akun dinonaktifkan.");
    const role = normalizeInternalRole(row.role); if (!role) throw new AppError("AUTH_FORBIDDEN", "Role pengguna belum didukung.");
    return { actor: { id: row.id, name: row.name, role } };
  }
  attachCookies(response: NextResponse, session: Pick<ResolvedSession, "token" | "expiresIn">) { if (session.token) response.cookies.set(env().AUTH_SESSION_COOKIE_NAME, session.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: session.expiresIn ?? 2_592_000 }); }
  clearCookies(response: NextResponse) { response.cookies.set(env().AUTH_SESSION_COOKIE_NAME, "", { httpOnly: true, expires: new Date(0), path: "/" }); }
  async revoke(request: NextRequest) { const token = request.cookies.get(env().AUTH_SESSION_COOKIE_NAME)?.value; if (token) await d1().execute("DELETE FROM sessions WHERE token_hash=?", [hash(token)]); }
}
