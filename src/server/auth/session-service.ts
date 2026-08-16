import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createAuthClient } from "@/server/supabase/clients";
import { env } from "@/server/env";
import { AppError } from "@/server/errors/app-error";
import { normalizeInternalRole, type Actor } from "@/types/domain";

export type ResolvedSession = {
  actor: Actor;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
};

export class SessionService {
  async resolve(request: NextRequest): Promise<ResolvedSession> {
    const config = env();
    let accessToken = request.cookies.get(
      config.AUTH_ACCESS_COOKIE_NAME,
    )?.value;
    const refreshToken = request.cookies.get(
      config.AUTH_REFRESH_COOKIE_NAME,
    )?.value;
    if (!accessToken)
      throw new AppError("AUTH_REQUIRED", "Silakan masuk terlebih dahulu.");
    const auth = createAuthClient();
    const initial = await auth.auth.getUser(accessToken);
    let data = initial.data;
    const error = initial.error;
    let rotated: ResolvedSession | undefined;
    if ((error || !data.user) && refreshToken) {
      const refreshed = await auth.auth.refreshSession({
        refresh_token: refreshToken,
      });
      if (refreshed.error || !refreshed.data.session)
        throw new AppError("AUTH_REQUIRED", "Sesi telah berakhir.");
      accessToken = refreshed.data.session.access_token;
      data = { user: refreshed.data.user! };
      rotated = {
        actor: {} as Actor,
        accessToken,
        refreshToken: refreshed.data.session.refresh_token,
        expiresIn: refreshed.data.session.expires_in,
      };
    }
    if (!data.user) throw new AppError("AUTH_REQUIRED", "Sesi tidak valid.");
    const { data: profile, error: profileError } = await createAdminClient()
      .from("profiles")
      .select("id,name,role,is_active")
      .eq("id", data.user.id)
      .single();
    if (profileError || !profile)
      throw new AppError("AUTH_FORBIDDEN", "Profil internal tidak ditemukan.");
    if (!profile.is_active)
      throw new AppError("AUTH_USER_DISABLED", "Akun dinonaktifkan.");
    const role = normalizeInternalRole(String(profile.role));
    if (!role)
      throw new AppError(
        "AUTH_FORBIDDEN",
        "Role pengguna belum didukung. Terapkan migration role terbaru.",
      );
    const actor = {
      id: profile.id,
      name: profile.name,
      role,
    } satisfies Actor;
    return {
      actor,
      accessToken: rotated?.accessToken,
      refreshToken: rotated?.refreshToken,
      expiresIn: rotated?.expiresIn,
    };
  }

  attachCookies(
    response: NextResponse,
    session: Pick<
      ResolvedSession,
      "accessToken" | "refreshToken" | "expiresIn"
    >,
  ) {
    if (!session.accessToken || !session.refreshToken) return;
    const config = env();
    const common = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    };
    response.cookies.set(config.AUTH_ACCESS_COOKIE_NAME, session.accessToken, {
      ...common,
      maxAge: session.expiresIn ?? 3600,
    });
    response.cookies.set(
      config.AUTH_REFRESH_COOKIE_NAME,
      session.refreshToken,
      { ...common, maxAge: 60 * 60 * 24 * 30 },
    );
  }

  clearCookies(response: NextResponse) {
    const config = env();
    response.cookies.set(config.AUTH_ACCESS_COOKIE_NAME, "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });
    response.cookies.set(config.AUTH_REFRESH_COOKIE_NAME, "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });
  }

  async revoke(request: NextRequest) {
    const config = env();
    const accessToken = request.cookies.get(
      config.AUTH_ACCESS_COOKIE_NAME,
    )?.value;
    if (accessToken)
      await createAdminClient().auth.admin.signOut(accessToken, "local");
  }
}
