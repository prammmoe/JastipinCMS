"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, RefreshCcw, Search } from "lucide-react";
import { api } from "@/lib/api-client/client";
import { formatDateTime, formatIdr } from "@/lib/formatters";
import { statusTextClass } from "@/lib/status-text";
import { useSnackbar } from "@/components/ui/snackbar";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";

type Field = {
  name: string;
  label: string;
  type?: "text" | "date" | "number" | "select";
  options?: string[];
  required?: boolean;
};
export type ResourceConfig = {
  title: string;
  description: string;
  endpoint: string;
  columns: [string, string][];
  fields?: Field[];
  detailBase?: string;
};
function value(row: Record<string, unknown>, key: string) {
  const raw = key
    .split(".")
    .reduce<unknown>(
      (current, part) =>
        typeof current === "object" && current
          ? (current as Record<string, unknown>)[part]
          : undefined,
      row,
    );
  if (key.endsWith("_idr")) return formatIdr(String(raw ?? 0));
  if (key.endsWith("_at") && raw) return formatDateTime(String(raw));
  if (typeof raw === "object" && raw) return JSON.stringify(raw);
  return String(raw ?? "—");
}
export function ResourcePage({ config }: { config: ResourceConfig }) {
  const searchParams = useSearchParams();
  const snackbar = useSnackbar();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(
    () => searchParams.get("search")?.trim() ?? "",
  );
  const [showForm, setShowForm] = useState(false);
  const load = useCallback(
    () => {
      setLoading(true);
      return api
        .get<Record<string, unknown>[]>(
          `${config.endpoint}${config.endpoint.includes("?") ? "&" : "?"}pageSize=50&search=${encodeURIComponent(search)}`,
        )
        .then(setRows)
        .catch((e) => snackbar.error(e.message))
        .finally(() => setLoading(false));
    },
    [config.endpoint, search, snackbar],
  );
  useEffect(() => {
    load();
  }, [load]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api.post(config.endpoint, data);
      event.currentTarget.reset();
      setShowForm(false);
      snackbar.success("Data berhasil disimpan.");
      load();
    } catch (value) {
      snackbar.error(
        value instanceof Error ? value.message : "Gagal menyimpan.",
      );
    }
  }
  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          config.fields && (
          <button className="button" onClick={() => setShowForm(!showForm)}>
            <Plus size={17} />
            Tambah
          </button>
          )
        }
      />
      {showForm && config.fields && (
        <form
          className="card"
          onSubmit={create}
          style={{
            padding: 20,
            marginBottom: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: 15,
          }}
        >
          {config.fields.map((field) => (
            <label key={field.name}>
              <span className="label">{field.label}</span>
              {field.type === "select" ? (
                <select
                  className="input"
                  name={field.name}
                  required={field.required}
                >
                  <option value="">Pilih</option>
                  {field.options?.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
                  name={field.name}
                  type={field.type ?? "text"}
                  required={field.required}
                />
              )}
            </label>
          ))}
          <div style={{ alignSelf: "end" }}>
            <button className="button">Simpan</button>
          </div>
        </form>
      )}
      <div className="card" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <strong style={{ fontSize: 14, fontWeight: 600 }}>
            {config.title} ({rows.length})
          </strong>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "min(100%, 390px)",
            }}
          >
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: 12,
                color: "var(--neutral-500)",
              }}
            />
            <input
              className="input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && load()}
              placeholder="Cari data..."
              style={{ paddingLeft: 38 }}
            />
          </div>
          <button className="button secondary" onClick={load}>
            <RefreshCcw size={16} />
          </button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                {config.columns.map(([, label]) => (
                  <th key={label}>{label}</th>
                ))}
                {config.detailBase && <th />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton
                  columns={config.columns.length}
                  hasActionColumn={Boolean(config.detailBase)}
                />
              ) : (
                <>
                  {rows.map((row, index) => (
                    <tr key={String(row.id ?? index)}>
                      {config.columns.map(([key]) => (
                        <td key={key}>
                          {key === "status" ? (
                            <span className={statusTextClass(value(row, key))}>
                              {value(row, key).replaceAll("_", " ")}
                            </span>
                          ) : (
                            value(row, key)
                          )}
                        </td>
                      ))}
                      {config.detailBase && (
                        <td>
                          <Link
                            className="button secondary"
                            href={`${config.detailBase}/${row.id}`}
                            style={{ padding: "6px 10px" }}
                          >
                            Detail
                          </Link>
                        </td>
                      )}
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={config.columns.length + (config.detailBase ? 1 : 0)}
                        className="muted"
                        style={{ textAlign: "center", padding: 30 }}
                      >
                        Belum ada data.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
