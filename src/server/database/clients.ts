import "server-only";
import { randomUUID } from "node:crypto";
import { d1, type SqlValue } from "@/server/d1/client";
import { hashPassword } from "@/server/auth/passwords";

type Result = { data: any; error: null | { message: string; code?: string }; count?: number | null };
const identifier = (value: string) => { if (!/^[a-z_][a-z0-9_]*$/i.test(value)) throw new Error("Invalid SQL identifier"); return value; };
const result = async <T>(work: Promise<T>): Promise<Result> => { try { return { data: await work, error: null }; } catch (error) { return { data: null, error: { message: error instanceof Error ? error.message : "D1 query failed" } }; } };

class Query implements PromiseLike<Result> {
  private filters: string[] = []; private params: SqlValue[] = []; private action: "select" | "insert" | "update" | "delete" = "select"; private payload: Record<string, unknown> | Record<string, unknown>[] | undefined; private columns = "*"; private orders: string[] = []; private take?: number; private skip?: number; private wantsSingle = false; private wantsCount = false;
  constructor(private table: string) { identifier(table); }
  select(columns = "*", options?: { count?: "exact"; head?: boolean }) { this.columns = columns.includes("(") ? "*" : columns; this.wantsCount = options?.count === "exact"; return this; }
  insert(value: Record<string, unknown> | Record<string, unknown>[]) { this.action = "insert"; this.payload = value; return this; }
  update(value: Record<string, unknown>) { this.action = "update"; this.payload = value; return this; }
  delete() { this.action = "delete"; return this; }
  eq(column: string, value: SqlValue) { return this.filter(`${identifier(column)} = ?`, value); }
  neq(column: string, value: SqlValue) { return this.filter(`${identifier(column)} <> ?`, value); }
  gt(column: string, value: SqlValue) { return this.filter(`${identifier(column)} > ?`, value); }
  gte(column: string, value: SqlValue) { return this.filter(`${identifier(column)} >= ?`, value); }
  lt(column: string, value: SqlValue) { return this.filter(`${identifier(column)} < ?`, value); }
  lte(column: string, value: SqlValue) { return this.filter(`${identifier(column)} <= ?`, value); }
  is(column: string, value: null) { return this.filter(`${identifier(column)} IS ?`, value); }
  not(column: string, operator: string, value: SqlValue) { return this.filter(`${identifier(column)} NOT ${operator.toUpperCase()} ?`, value); }
  ilike(column: string, value: string) { return this.filter(`LOWER(${identifier(column)}) LIKE LOWER(?)`, value); }
  in(column: string, values: SqlValue[]) { if (!values.length) return this.filter("0", null, false); return this.filter(`${identifier(column)} IN (${values.map(() => "?").join(",")})`, values); }
  or(expression: string) { const parts = expression.split(",").map((part) => { const [column, operator, value] = part.split("."); if (operator !== "ilike") throw new Error("Unsupported D1 filter"); this.params.push(value); return `LOWER(${identifier(column)}) LIKE LOWER(?)`; }); this.filters.push(`(${parts.join(" OR ")})`); return this; }
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) { this.orders.push(`${identifier(column)} ${options?.ascending === false ? "DESC" : "ASC"}`); return this; }
  limit(value: number) { this.take = value; return this; } range(from: number, to: number) { this.skip = from; this.take = to - from + 1; return this; }
  single() { this.wantsSingle = true; return this; } maybeSingle() { this.wantsSingle = true; return this; }
  upsert(value: Record<string, unknown>) { this.action = "insert"; this.payload = value; return this; }
  private filter(sql: string, value: SqlValue | SqlValue[], add = true) { this.filters.push(sql); if (add) this.params.push(...(Array.isArray(value) ? value : [value])); return this; }
  then<TResult1 = Result, TResult2 = never>(onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null) { return this.run().then(onfulfilled, onrejected); }
  private async run(): Promise<Result> { return result(this.execute()).then((r) => ({ ...r, data: this.wantsSingle && Array.isArray(r.data) ? r.data[0] ?? null : r.data })); }
  private async execute() {
    const where = this.filters.length ? ` WHERE ${this.filters.join(" AND ")}` : ""; const db = d1();
    if (this.action === "select") { const rows = await db.query(`SELECT ${this.columns} FROM ${this.table}${where}${this.orders.length ? ` ORDER BY ${this.orders.join(",")}` : ""}${this.take !== undefined ? " LIMIT ?" : ""}${this.skip !== undefined ? " OFFSET ?" : ""}`, [...this.params, ...(this.take === undefined ? [] : [this.take]), ...(this.skip === undefined ? [] : [this.skip])]); return rows; }
    if (this.action === "delete") { await db.execute(`DELETE FROM ${this.table}${where}`, this.params); return null; }
    const rows = Array.isArray(this.payload) ? this.payload : [this.payload!]; const output: Record<string, unknown>[] = [];
    for (const row of rows) { const entries = Object.entries(row); if (this.action === "insert") { const sql = `INSERT INTO ${this.table} (${entries.map(([key]) => identifier(key)).join(",")}) VALUES (${entries.map(() => "?").join(",")}) RETURNING *`; const inserted = await db.one(sql, entries.map(([, value]) => value == null ? null : typeof value === "object" ? JSON.stringify(value) : value as SqlValue)); if (inserted) output.push(inserted); } else { const sql = `UPDATE ${this.table} SET ${entries.map(([key]) => `${identifier(key)}=?`).join(",")}${where} RETURNING *`; output.push(...await db.query(sql, [...entries.map(([, value]) => value == null ? null : typeof value === "object" ? JSON.stringify(value) : value as SqlValue), ...this.params])); } }
    return output;
  }
}

export function createAdminClient(): any { return { from: (table: string) => new Query(table), auth: { admin: {} }, rpc: async (name: string, args: Record<string, SqlValue>) => { if (name !== "next_business_code") return { data: null, error: { message: `D1 RPC ${name} must be migrated to service transaction` } }; const scope = `${args.p_scope}${args.p_date ? `:${String(args.p_date).replaceAll("-", "")}` : ""}`; await d1().execute("INSERT INTO business_counters(scope,last_value,updated_at) VALUES(?,1,?) ON CONFLICT(scope) DO UPDATE SET last_value=last_value+1,updated_at=excluded.updated_at", [scope, new Date().toISOString()]); const row = await d1().one<{ last_value: number }>("SELECT last_value FROM business_counters WHERE scope=?", [scope]); return { data: `${args.p_prefix}${args.p_date ? `-${String(args.p_date).replaceAll("-", "")}` : ""}-${String(row?.last_value ?? 1).padStart(4, "0")}`, error: null }; } }; }
export const newId = () => randomUUID();
