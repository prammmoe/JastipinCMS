import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { SessionService } from "@/server/auth/session-service";
import { can, type Capability } from "@/server/auth/permissions";
import { AppError } from "@/server/errors/app-error";
import { fail } from "@/server/api/response";
import { env } from "@/server/env";
import type { Actor } from "@/types/domain";

export type ApiContext = { actor: Actor; requestId: string };
export async function withApi(
  request: NextRequest,
  capability: Capability | null,
  handler: (context: ApiContext) => Promise<NextResponse>,
) {
  const started = Date.now();
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  let status = 500;
  let actor: Actor | undefined;
  try {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      const origin = request.headers.get("origin");
      if (origin && origin !== new URL(env().APP_URL).origin)
        throw new AppError(
          "CSRF_ORIGIN_INVALID",
          "Origin permintaan tidak diizinkan.",
        );
    }
    const service = new SessionService();
    const session = await service.resolve(request);
    actor = session.actor;
    if (capability && !can(actor.role, capability))
      throw new AppError(
        "AUTH_FORBIDDEN",
        "Anda tidak memiliki izin untuk tindakan ini.",
      );
    const response = await handler({ actor, requestId });
    service.attachCookies(response, session);
    response.headers.set("x-request-id", requestId);
    response.headers.set("cache-control", "private, no-store");
    status = response.status;
    return response;
  } catch (error) {
    const response = fail(error, requestId);
    status = response.status;
    return response;
  } finally {
    console.info(
      JSON.stringify({
        request_id: requestId,
        route: request.nextUrl.pathname,
        method: request.method,
        user_id: actor?.id,
        role: actor?.role,
        duration_ms: Date.now() - started,
        status_code: status,
      }),
    );
  }
}
