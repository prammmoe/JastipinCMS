import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { d1 } from "@/server/d1/client";
import { AppError } from "@/server/errors/app-error";
import { verifyPassword } from "@/server/auth/passwords";
import { normalizeInternalRole } from "@/types/domain";

const SESSION_SECONDS = 60 * 60 * 24 * 30;
const now = () => new Date().toISOString();
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export class AuthService {
  async login(email: string, password: string, ip: string) {
    const db = d1(); const normalized = email.trim().toLowerCase();
    const identifier = createHash("sha256").update(`${normalized}|${ip}`).digest("hex");
    const limit = await db.one<{ attempts: number; window_started_at: string; blocked_until: string | null }>("SELECT attempts, window_started_at, blocked_until FROM login_rate_limits WHERE identifier_hash=?", [identifier]);
    const time = Date.now();
    if (limit?.blocked_until && Date.parse(limit.blocked_until) > time) throw new AppError("LOGIN_RATE_LIMITED", "Terlalu banyak percobaan. Coba lagi nanti.");
    const profile = await db.one<{ id: string; name: string; role: string; is_active: number; password_hash: string }>("SELECT id,name,role,is_active,password_hash FROM profiles WHERE email=?", [normalized]);
    if (!profile || !profile.is_active || !(await verifyPassword(password, profile.password_hash))) {
      const within = !!limit && time - Date.parse(limit.window_started_at) < 900_000; const attempts = within ? limit.attempts + 1 : 1;
      await db.execute("INSERT INTO login_rate_limits(identifier_hash,attempts,window_started_at,blocked_until) VALUES(?,?,?,?) ON CONFLICT(identifier_hash) DO UPDATE SET attempts=excluded.attempts,window_started_at=excluded.window_started_at,blocked_until=excluded.blocked_until", [identifier, attempts, within ? limit!.window_started_at : now(), attempts >= 5 ? new Date(time + 900_000).toISOString() : null]);
      throw new AppError("AUTH_INVALID_CREDENTIALS", "Email atau password salah.");
    }
    const role = normalizeInternalRole(profile.role); if (!role) throw new AppError("AUTH_FORBIDDEN", "Role pengguna belum didukung.");
    await db.execute("DELETE FROM login_rate_limits WHERE identifier_hash=?", [identifier]);
    const token = randomBytes(32).toString("base64url"), expiresIn = SESSION_SECONDS;
    await db.execute("INSERT INTO sessions(id,token_hash,profile_id,expires_at,created_at) VALUES(?,?,?,?,?)", [randomUUID(), tokenHash(token), profile.id, new Date(time + expiresIn * 1000).toISOString(), now()]);
    return { profile: { id: profile.id, name: profile.name, role }, session: { token, expiresIn } };
  }
}
