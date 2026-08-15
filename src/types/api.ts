export type ApiSuccess<T> = { data: T; meta?: Record<string, unknown> };
export type ApiFailure = {
  error: { code: string; message: string; details?: unknown };
};
