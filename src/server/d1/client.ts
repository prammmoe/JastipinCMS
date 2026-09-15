import { env } from "@/server/env";

export type SqlValue = string | number | boolean | null | undefined | SqlValue[];
export type SqlStatement = { sql: string; params?: SqlValue[] };

type D1Result<T> = { success: boolean; results?: T[]; meta?: { changes?: number } };
type D1Response<T> = { success: boolean; errors?: { message: string; code?: number }[]; result?: D1Result<T>[] };

export class D1Error extends Error {
  constructor(message: string, public readonly code?: string) { super(message); }
}

/** Server-only D1 REST client. Values are always sent separately from SQL text. */
export class D1Client {
  private async request<T>(body: { sql: string; params?: SqlValue[] } | { batch: SqlStatement[] }) {
    const config = env();
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${config.CLOUDFLARE_ACCOUNT_ID}/d1/database/${config.CLOUDFLARE_D1_DATABASE_ID}/query`,
      { method: "POST", headers: { authorization: `Bearer ${config.CLOUDFLARE_D1_API_TOKEN}`, "content-type": "application/json" }, body: JSON.stringify(body), cache: "no-store" },
    );
    const payload = await response.json().catch(() => ({})) as D1Response<T>;
    if (!response.ok || !payload.success || payload.errors?.length) throw new D1Error(payload.errors?.[0]?.message ?? `D1 request failed (${response.status})`, String(payload.errors?.[0]?.code ?? response.status));
    return payload.result ?? [];
  }

  async query<T extends Record<string, unknown>>(sql: string, params: SqlValue[] = []) { return (await this.request<T>({ sql, params }))[0]?.results ?? []; }
  async one<T extends Record<string, unknown>>(sql: string, params: SqlValue[] = []) { return (await this.query<T>(sql, params))[0] ?? null; }
  async execute(sql: string, params: SqlValue[] = []) { return (await this.request<Record<string, never>>({ sql, params }))[0]?.meta?.changes ?? 0; }
  async batch(statements: SqlStatement[]) { return this.request<Record<string, unknown>>({ batch: statements }); }
}

let client: D1Client | undefined;
export function d1() { return client ??= new D1Client(); }
