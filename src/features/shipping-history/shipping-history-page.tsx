"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, RotateCcw, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client/client";
import { useSnackbar } from "@/components/ui/snackbar";
import { formatDate, formatIdr } from "@/lib/formatters";
import { packageStatusLabel } from "@/lib/package-status";
import { statusTextClass } from "@/lib/status-text";

type HistoryRow = {
  id: string;
  code: string;
  closing_date: string;
  status: string;
  package_count: number;
  total_amount_idr: string | number;
  exception_count: number;
};

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

export function ShippingHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const snackbar = useSnackbar();
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [month, setMonth] = useState(() => searchParams.get("month") ?? "");
  const [sort, setSort] = useState(() => searchParams.get("sort") ?? "");
  const [dateFrom, setDateFrom] = useState(() => searchParams.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = useState(() => searchParams.get("dateTo") ?? "");
  const activeFilterCount = [search, month, dateFrom, dateTo].filter(Boolean).length;

  function resetFilters() {
    setSearch("");
    setMonth("");
    setSort("");
    setDateFrom("");
    setDateTo("");
  }

  const load = useCallback(() => {
    const query = new URLSearchParams({ pageSize: "50" });
    if (search) query.set("search", search);
    if (month) query.set("month", month);
    if (sort) query.set("sort", sort);
    if (dateFrom) query.set("dateFrom", dateFrom);
    if (dateTo) query.set("dateTo", dateTo);
    setLoading(true);
    api
      .get<HistoryRow[]>(`/api/v1/shipping-history?${query}`)
      .then(setRows)
      .catch((value) =>
        snackbar.error(
          value instanceof Error ? value.message : "Gagal memuat data.",
        ),
      )
      .finally(() => setLoading(false));
  }, [search, month, sort, dateFrom, dateTo, snackbar]);

  useEffect(() => {
    const timer = window.setTimeout(load, 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (month) params.set("month", month);
    if (sort) params.set("sort", sort);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const query = params.toString();
    router.replace(query ? `/shipping-history?${query}` : "/shipping-history", {
      scroll: false,
    });
  }, [search, month, sort, dateFrom, dateTo, router]);

  return (
    <>
      <PageHeader
        title="History Pengiriman"
        description="Closing yang sudah selesai."
      />
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: 18, borderBottom: "1px solid var(--border)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Filter size={16} color="var(--neutral-600)" />
              <strong style={{ fontSize: 14, fontWeight: 600 }}>
                Filter riwayat
              </strong>
              {activeFilterCount > 0 && (
                <span className="badge">{activeFilterCount} aktif</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="muted" style={{ fontSize: 12 }}>
                {rows.length} riwayat ditemukan
              </span>
              {(activeFilterCount > 0 || sort) && (
                <button
                  type="button"
                  className="button ghost"
                  onClick={resetFilters}
                  style={{ minHeight: 32, padding: "5px 9px", fontSize: 12 }}
                >
                  <RotateCcw size={13} />
                  Reset
                </button>
              )}
            </div>
          </div>
          <div
            className="grid-responsive"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              alignItems: "end",
            }}
          >
            <label>
              <span className="label">Cari</span>
              <span style={{ position: "relative", display: "block" }}>
                <Search
                  size={16}
                  color="var(--neutral-500)"
                  style={{ position: "absolute", left: 12, top: 13 }}
                />
                <input
                  className="input"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari kode pengiriman..."
                  style={{ paddingLeft: 38 }}
                />
              </span>
            </label>
            <label>
              <span className="label">Periode</span>
              <select
                className="input"
                value={month}
                onChange={(event) => {
                  setMonth(event.target.value);
                  if (event.target.value) {
                    setDateFrom("");
                    setDateTo("");
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
            <label>
              <span className="label">Urutkan</span>
              <select
                className="input"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="">Urutan default</option>
                <option value="closing_date:desc">Terbaru</option>
                <option value="closing_date:asc">Terlama</option>
              </select>
            </label>
            <label>
              <span className="label">Dari tanggal</span>
              <input
                type="date"
                className="input"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  if (event.target.value) setMonth("");
                }}
              />
            </label>
            <label>
              <span className="label">Sampai tanggal</span>
              <input
                type="date"
                className="input"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  if (event.target.value) setMonth("");
                }}
              />
            </label>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th style={{ padding: "8px 12px" }}>Kode</th>
                <th style={{ padding: "8px 12px" }}>Tgl</th>
                <th style={{ padding: "8px 12px" }}>Pk</th>
                <th style={{ padding: "8px 12px" }}>Total</th>
                <th style={{ padding: "8px 12px" }}>Status</th>
                <th style={{ padding: "8px 12px" }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton columns={5} hasActionColumn />
              ) : (
                <>
                  {rows.map((row) => (
                    <tr key={row.id} style={{ margin: "4px 0", borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "4px 8px" }}>{row.code}</td>
                      <td style={{ padding: "4px 8x" }}>{formatDate(row.closing_date)}</td>
                      <td style={{ padding: "4px 8x" }}>{row.package_count}</td>
                      <td style={{ padding: "4px 8x" }}>{formatIdr(row.total_amount_idr)}</td>
                      <td style={{ padding: "4px 8x" }}>
                        <span className={statusTextClass(row.status)}>
                          {packageStatusLabel(row.status)}
                        </span>
                      </td>
                      <td style={{ padding: "4px 8x" }}>
                        <Link
                          href={`/shipping-history/${row.id}`}
                          style={{ padding: "4px 6px", fontSize: "0.813rem" }}
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "12px", color: "#6b7280" }}>
                        Belum ada riwayat pengiriman.
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
