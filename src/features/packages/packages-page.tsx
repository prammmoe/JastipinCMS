"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client/client";
import { formatIdr, formatReceivedDate } from "@/lib/formatters";
import { PACKAGE_STATUSES, packageStatusLabel } from "@/lib/package-status";
import { statusTextClass } from "@/lib/status-text";
import { CustomerGroups, type CustomerGroup } from "./customer-groups";
import { CustomerFilter } from "./customer-filter";
import { ClosingSelect } from "./closing-select";
import type { Actor } from "@/types/domain";

type PackageRow = {
  id: string;
  package_code: string;
  tracking_number: string;
  status: string;
  shipping_fee_idr: string | number;
  received_date: string;
  received_time: string | null;
  customers: { name: string } | null;
};

type DatePreset = "" | "today" | "7d" | "30d" | "custom";

const toDateInput = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);

function presetRange(preset: DatePreset) {
  const today = new Date();
  if (preset === "today") {
    const value = toDateInput(today);
    return { dateFrom: value, dateTo: value };
  }
  if (preset === "7d" || preset === "30d") {
    const days = preset === "7d" ? 6 : 29;
    const from = new Date(today);
    from.setDate(today.getDate() - days);
    return { dateFrom: toDateInput(from), dateTo: toDateInput(today) };
  }
  return { dateFrom: "", dateTo: "" };
}

function monthRange(month: string) {
  const [year, num] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, num, 0)).getUTCDate();
  return {
    dateFrom: `${month}-01`,
    dateTo: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

function monthOptions() {
  const now = new Date();
  const labels = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
  return Array.from({ length: 12 }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { value, label: labels.format(date) };
  });
}

export function PackagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"packages" | "customers">(
    () => (searchParams.get("view") === "customers" ? "customers" : "packages"),
  );
  const [rows, setRows] = useState<PackageRow[]>([]);
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [datePreset, setDatePreset] = useState<DatePreset>(() => (searchParams.get("preset") as DatePreset) ?? "");
  const [month, setMonth] = useState(() => searchParams.get("month") ?? "");
  const [customFrom, setCustomFrom] = useState(() => searchParams.get("from") ?? "");
  const [customTo, setCustomTo] = useState(() => searchParams.get("to") ?? "");
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "");
  const [sort, setSort] = useState(() => searchParams.get("sort") ?? "received_desc");
  const [customerId, setCustomerId] = useState(() => searchParams.get("customerId") ?? "");
  const [page, setPage] = useState(() => Number(searchParams.get("page") ?? "1") || 1);
  const [pageSize, setPageSize] = useState(() => {
    const value = Number(searchParams.get("pageSize") ?? "50");
    return [10, 50, 200].includes(value) ? value : 50;
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [user, setUser] = useState<Actor>();

  useEffect(() => {
    api
      .get<Actor>("/api/v1/auth/me")
      .then(setUser)
      .catch(() => {});
  }, []);

  const { dateFrom, dateTo } = useMemo(() => {
    if (month) return monthRange(month);
    if (datePreset === "custom")
      return { dateFrom: customFrom, dateTo: customTo };
    return presetRange(datePreset);
  }, [month, datePreset, customFrom, customTo]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (view !== "packages") params.set("view", view);
    if (search) params.set("search", search);
    if (datePreset) params.set("preset", datePreset);
    if (month) params.set("month", month);
    if (customFrom) params.set("from", customFrom);
    if (customTo) params.set("to", customTo);
    if (status) params.set("status", status);
    if (sort !== "received_desc") params.set("sort", sort);
    if (customerId) params.set("customerId", customerId);
    if (page !== 1) params.set("page", String(page));
    if (pageSize !== 50) params.set("pageSize", String(pageSize));
    const query = params.toString();
    router.replace(query ? `/packages?${query}` : "/packages", {
      scroll: false,
    });
  }, [view, search, datePreset, month, customFrom, customTo, status, sort, customerId, page, pageSize, router]);

  const load = useCallback(() => {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize), search, sort });
    if (dateFrom) query.set("dateFrom", dateFrom);
    if (dateTo) query.set("dateTo", dateTo);
    if (status) query.set("status", status);
    if (view === "customers" && customerId) query.set("customerId", customerId);
    setLoading(true);
    setError("");
    const path =
      view === "customers"
        ? `/api/v1/packages/grouped-by-customer?${query}`
        : `/api/v1/packages?${query}`;
    api
      .getPaged<PackageRow[] | CustomerGroup[]>(path)
      .then(({ data, meta }) => {
        if (view === "customers") setGroups(data as CustomerGroup[]);
        else setRows(data as PackageRow[]);
        setTotal(meta?.total ?? 0);
        setTotalPages(Math.max(1, meta?.totalPages ?? 1));
        if (page > (meta?.totalPages ?? 1)) setPage(meta?.totalPages ?? 1);
      })
      .catch((value) =>
        setError(value instanceof Error ? value.message : "Gagal memuat data."),
      )
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo, search, sort, status, view, customerId, page, pageSize]);

  useEffect(() => {
    const timer = window.setTimeout(load, 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [view, search, datePreset, month, customFrom, customTo, status, sort, customerId, pageSize]);

  return (
    <>
      <PageHeader
        title="Semua Barang"
        description="Cari, filter, dan urutkan seluruh paket."
        actions={
          user && (user.role === "ADMIN" || user.role === "STAFF_SIDOARJO") ? (
            <button className="button" onClick={() => setSelecting((value) => !value)}>
              {selecting ? "Kembali ke daftar" : "Buat Closing Surabaya"}
            </button>
          ) : undefined
        }
      />
      {selecting ? (
        <ClosingSelect
          search={search}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onExit={() => setSelecting(false)}
        />
      ) : (
      <div className="card" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            borderBottom: "1px solid var(--border)",
            flexWrap: "wrap",
          }}
        >
          <strong style={{ fontSize: 14, fontWeight: 600 }}>
            {view === "customers" ? "Per Customer" : "Per Barang"}
          </strong>
          <div
            style={{
              display: "flex",
              gap: 6,
              background: "var(--neutral-100)",
              borderRadius: "var(--radius-md)",
              padding: 3,
            }}
          >
            <button
              className="button"
              style={{
                ...(view === "packages"
                  ? { background: "var(--primary)", color: "white" }
                  : {}),
              }}
              onClick={() => setView("packages")}
            >
              Per Barang
            </button>
            <button
              className="button"
              style={{
                ...(view === "customers"
                  ? { background: "var(--primary)", color: "white" }
                  : {}),
              }}
              onClick={() => setView("customers")}
            >
              Per Customer
            </button>
          </div>
        </div>
        <div
          style={{
            padding: 18,
            display: "grid",
            gridTemplateColumns:
              view === "customers"
                ? "minmax(200px,1.6fr) minmax(180px,1fr) minmax(180px,1fr) repeat(2,minmax(150px,1fr))"
                : "minmax(220px,2fr) repeat(4,minmax(150px,1fr))",
            gap: 10,
            alignItems: "end",
            borderBottom: "1px solid var(--border)",
          }}
          className="grid-responsive"
        >
          <label>
            <span className="label">Cari</span>
            <span style={{ position: "relative", display: "block" }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: 12 }} />
              <input
                className="input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  view === "customers"
                    ? "Nomor resi, kode, atau nama customer"
                    : "Nomor resi, kode, atau nama customer"
                }
                style={{ paddingLeft: 38 }}
              />
            </span>
          </label>
          {view === "customers" && (
            <CustomerFilter value={customerId} onChange={setCustomerId} />
          )}
          <label>
            <span className="label">Tanggal</span>
            <select
              className="input"
              value={datePreset}
              onChange={(event) => {
                const next = event.target.value as DatePreset;
                setDatePreset(next);
                if (next !== "custom") {
                  setMonth("");
                  setCustomFrom("");
                  setCustomTo("");
                }
              }}
            >
              <option value="">Semua tanggal</option>
              <option value="today">Hari ini</option>
              <option value="7d">7 hari terakhir</option>
              <option value="30d">30 hari terakhir</option>
              <option value="custom">Custom (range)</option>
            </select>
          </label>
          <label>
            <span className="label">Periode</span>
            <select
              className="input"
              value={month}
              onChange={(event) => {
                const next = event.target.value;
                setMonth(next);
                if (next) {
                  setDatePreset("");
                  setCustomFrom("");
                  setCustomTo("");
                }
              }}
            >
              <option value="">Semua bulan</option>
              {monthOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {datePreset === "custom" && (
            <>
              <label>
                <span className="label">Dari tanggal</span>
                <input
                  className="input"
                  type="date"
                  value={customFrom}
                  onChange={(event) => setCustomFrom(event.target.value)}
                />
              </label>
              <label>
                <span className="label">Sampai tanggal</span>
                <input
                  className="input"
                  type="date"
                  value={customTo}
                  onChange={(event) => setCustomTo(event.target.value)}
                />
              </label>
            </>
          )}
          <label>
            <span className="label">Status</span>
            <select className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Semua status</option>
              {PACKAGE_STATUSES.map((value) => (
                <option key={value} value={value}>{packageStatusLabel(value)}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Urutkan</span>
            <select className="input" value={sort} onChange={(event) => setSort(event.target.value)}>
              {view === "customers" ? (
                <>
                  <option value="name_asc">Nama A-Z</option>
                  <option value="packages_desc">Barang Terbanyak</option>
                  <option value="received_desc">Terbaru</option>
                </>
              ) : (
                <>
                  <option value="received_desc">Terbaru</option>
                  <option value="received_asc">Terlama</option>
                  <option value="fee_desc">Biaya terbesar</option>
                  <option value="fee_asc">Biaya terkecil</option>
                </>
              )}
            </select>
          </label>
        </div>
        {error && <div className="feedback error" style={{ margin: 16 }}>{error}</div>}
        {view === "customers" ? (
          <div style={{ padding: 16 }}>
            <CustomerGroups groups={groups} loading={loading} error={error} />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>Kode</th><th>Nomor Resi</th><th>Customer</th><th>Status</th><th>Biaya</th><th>Diterima</th><th /></tr></thead>
              <tbody>
                {loading ? (
                  <TableSkeleton columns={6} hasActionColumn />
                ) : (
                  <>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.package_code}</td>
                        <td>{row.tracking_number}</td>
                        <td>{row.customers?.name ?? "—"}</td>
                        <td><span className={statusTextClass(row.status)}>{packageStatusLabel(row.status)}</span></td>
                        <td>{formatIdr(row.shipping_fee_idr)}</td>
                        <td>{formatReceivedDate(row.received_date, row.received_time)}</td>
                        <td><Link className="button secondary" href={`/packages/${row.id}`} style={{ padding: "6px 10px" }}>Detail</Link></td>
                      </tr>
                    ))}
                    {!rows.length && (
                      <tr>
                        <td colSpan={7} className="muted" style={{ textAlign: "center", padding: 30 }}>
                          Belum ada data.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div
          style={{
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            borderTop: "1px solid var(--border)",
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="muted" style={{ fontSize: 12 }}>Per halaman</span>
            <select
              className="input"
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              style={{ width: 90, minHeight: 34, paddingTop: 6, paddingBottom: 6 }}
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={200}>200</option>
            </select>
          </label>
          <div className="muted" style={{ fontSize: 12 }}>
            Menampilkan {loading ? "…" : rows.length} dari {total} data
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              className="button secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Sebelumnya
            </button>
            <span className="muted" style={{ fontSize: 12, minWidth: 60, textAlign: "center" }}>
              {page} / {totalPages}
            </span>
            <button
              className="button secondary"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>
      )}
    </>
  );
}