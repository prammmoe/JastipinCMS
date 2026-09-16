import "server-only";
import { createHash } from "node:crypto";
import { createAdminClient, createAuthClient } from "@/server/supabase/clients";
import { AppError } from "@/server/errors/app-error";
import { normalizeInternalRole } from "@/types/domain";

export class AuthService {
  async login(email: string, password: string, ip: string) {
    const admin=createAdminClient(); const hash=createHash("sha256").update(`${email.trim().toLowerCase()}|${ip}`).digest("hex");
    const now=Date.now(); const { data: limit }=await admin.from("login_rate_limits").select("*").eq("identifier_hash",hash).maybeSingle();
    if (limit?.blocked_until && new Date(limit.blocked_until).getTime()>now) throw new AppError("LOGIN_RATE_LIMITED","Terlalu banyak percobaan. Coba lagi nanti.");
    const auth=createAuthClient(); const result=await auth.auth.signInWithPassword({email,password});
    if (result.error || !result.data.session) {
      const within=limit && now-new Date(limit.window_started_at).getTime()<15*60_000; const attempts=within ? limit.attempts+1 : 1;
      await admin.from("login_rate_limits").upsert({identifier_hash:hash,attempts,window_started_at:within?limit.window_started_at:new Date().toISOString(),blocked_until:attempts>=5?new Date(now+15*60_000).toISOString():null});
      throw new AppError("AUTH_INVALID_CREDENTIALS","Email atau password salah.");
    }
    const { data: profile }=await admin.from("profiles").select("id,name,role,is_active").eq("id",result.data.user.id).maybeSingle();
    if (!profile?.is_active) { await auth.auth.signOut(); throw new AppError("AUTH_INVALID_CREDENTIALS","Email atau password salah."); }
    const role = normalizeInternalRole(String(profile.role));
    if (!role) { await auth.auth.signOut(); throw new AppError("AUTH_FORBIDDEN","Role pengguna belum didukung. Terapkan migration role terbaru."); }
    await admin.from("login_rate_limits").delete().eq("identifier_hash",hash);
    return { profile: { ...profile, role }, session: result.data.session };
  }
}
