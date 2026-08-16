import { NextRequest } from "next/server";
import { z } from "zod";
import { AuthService } from "@/server/services/auth-service";
import { JastipinService } from "@/server/services/jastipin-service";
import { SessionService } from "@/server/auth/session-service";
import { withApi } from "@/server/api/with-api";
import { ok, fail } from "@/server/api/response";
import { env } from "@/server/env";
import { AppError } from "@/server/errors/app-error";
import type { Capability } from "@/server/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z.object({ email: z.email(), password: z.string().min(1) });
type RouteContext = { params: Promise<{ segments: string[] }> };

function capability(segments: string[], method: string): Capability | null {
  const [resource, id, action] = segments;
  if (resource === "dashboard") return "dashboard:view";
  if (resource === "customers")
    return method === "GET" ? "dashboard:view" : "customers:manage";
  if (
    (resource === "packages" || resource === "unidentified") &&
    method === "GET"
  )
    return "packages:view";
  if (resource === "files")
    return method === "GET" ? "packages:view" : "packages:edit";
  if (resource === "packages")
    return method === "PATCH" ? "packages:edit" : "packages:receive";
  if (resource === "closings") {
    if (method === "GET") return "closings:view";
    if (method === "POST" && (!id || id === "save-surabaya"))
      return "closings:create";
    if (action === "merauke-check" || action === "merauke-exception")
      return "closings:crosscheck";
    return "closings:edit";
  }
  if (resource === "shipping-history") return "shipping-history:view";
  if (resource === "shipments")
    return action === "arrival-scan" || action === "reconcile"
      ? "packages:arrive"
      : "shipments:manage";
  if (resource === "pickups") return "pickups:manage";
  if (resource === "invoices") return "invoices:view";
  if (resource === "payments")
    return method === "GET" ? "invoices:view" : "payments:manage";
  if (resource === "expenses") return "expenses:manage";
  if (resource === "reports") return "reports:view";
  if (["users", "rate-configs", "audit-logs", "settings"].includes(resource))
    return "settings:manage";
  return null;
}

async function handle(request: NextRequest, context: RouteContext) {
  const { segments } = await context.params;
  if (
    segments[0] === "auth" &&
    segments[1] === "login" &&
    request.method === "POST"
  ) {
    const requestId =
      request.headers.get("x-request-id") ?? crypto.randomUUID();
    try {
      const origin = request.headers.get("origin");
      if (origin && origin !== new URL(env().APP_URL).origin)
        throw new AppError(
          "CSRF_ORIGIN_INVALID",
          "Origin permintaan tidak diizinkan.",
        );
      const input = loginSchema.parse(await request.json());
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown";
      const result = await new AuthService().login(
        input.email,
        input.password,
        ip,
      );
      const response = ok({ user: result.profile });
      new SessionService().attachCookies(response, {
        accessToken: result.session.access_token,
        refreshToken: result.session.refresh_token,
        expiresIn: result.session.expires_in,
      });
      response.headers.set("cache-control", "private, no-store");
      return response;
    } catch (error) {
      return fail(error, requestId);
    }
  }
  if (
    segments[0] === "auth" &&
    segments[1] === "logout" &&
    request.method === "POST"
  )
    return withApi(request, null, async () => {
      const service = new SessionService();
      await service.revoke(request);
      const response = ok({ loggedOut: true });
      service.clearCookies(response);
      return response;
    });
  if (
    segments[0] === "auth" &&
    segments[1] === "me" &&
    request.method === "GET"
  )
    return withApi(request, null, async ({ actor }) => ok(actor));
  return withApi(
    request,
    capability(segments, request.method),
    async ({ actor }) =>
      new JastipinService().dispatch(request, segments, actor),
  );
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
