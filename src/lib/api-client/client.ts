import { ApiClientError } from "./errors";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!path.startsWith("/api/v1/"))
    throw new Error("API client hanya menerima URL same-origin /api/v1/.");
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { "content-type": "application/json" }),
      ...init?.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      !location.pathname.startsWith("/login")
    )
      location.assign("/login");
    throw new ApiClientError(
      payload.error?.code ?? "API_ERROR",
      payload.error?.message ?? "Permintaan gagal.",
      payload.error?.details,
    );
  }
  return payload.data as T;
}

async function requestPaged<T>(path: string): Promise<PagedResult<T>> {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
  });
  const payload = await response.json();
  if (!response.ok) {
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      !location.pathname.startsWith("/login")
    )
      location.assign("/login");
    throw new ApiClientError(
      payload.error?.code ?? "API_ERROR",
      payload.error?.message ?? "Permintaan gagal.",
      payload.error?.details,
    );
  }
  return { data: payload.data as T, meta: payload.meta };
}

export type PagedResult<T> = {
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
export const api = {
  get: <T>(path: string) => request<T>(path),
  getPaged: <T>(path: string) => requestPaged<T>(path),
  post: <T>(path: string, body?: unknown, headers?: HeadersInit) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
      headers,
    }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
