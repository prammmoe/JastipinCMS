import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/server/errors/app-error";

export function ok<T>(
  data: T,
  meta?: Record<string, unknown>,
  init?: ResponseInit,
) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) }, init);
}

export function fail(error: unknown, requestId: string) {
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Data tidak valid.",
          details: error.issues,
        },
        meta: { requestId },
      },
      { status: 400 },
    );
  if (error instanceof AppError)
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        meta: { requestId },
      },
      { status: error.status },
    );
  console.error(
    JSON.stringify({
      request_id: requestId,
      event: "unhandled_api_error",
      error: error instanceof Error ? error.message : "unknown",
    }),
  );
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Terjadi kesalahan pada server.",
      },
      meta: { requestId },
    },
    { status: 500 },
  );
}
