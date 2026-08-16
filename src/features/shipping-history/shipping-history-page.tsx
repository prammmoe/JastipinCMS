"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client/client";
import { formatDate, formatIdr } from "@/lib/formatters";
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
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [month, setMonth] = useState(() => searchParams.get("month") ?? "");

  const load = useCallback(() => {
    const query = new URLSearchParams({ pageSize: "50" });
    if (search) query.set("search", search);
    if (month) query.set("month", month);
    setLoading(true);
    setError("");
    api
      .get<HistoryRow[]>(`/api/v1/shipping-history?${query}`)
      .then(setRows)
      .catch((value) =>
        setError(value instanceof Error ? value.message : "Gagal memuat data."),
      )
      .finally(() => setLoading(false));
  }, [search, month]);

  useEffect(() => {
    const timer = window.setTimeout(load, 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (month) params.set("month", month);
    const query = params.toString();
    router.replace(query ? `/shipping-history?${query}` : "/shipping-history", {
      scroll: false,
    });
  }, [search, month, router]);

  return (
    <>
      <PageHeader
        title="History Pengiriman"
        description="Closing yang sudah selesai."
      />
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
            Riwayat ({rows.length})
          </strong>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "min(100%, 420px)",
            }}
          >
            <input
              className="input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari kode closing..."
            />
            <select
              className="input"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              style={{ width: 170 }}
            >
              <option value="">Semua bulan</option>
              {monthOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && <div className="feedback error" style={{ margin: 16 }}>{error}</div>}
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Tanggal</th>
                <th>Paket</th>
                <th>Total</th>
                <th>Ekspedisi</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton columns={6} hasActionColumn />
              ) : (
                <>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.code}</td>
                      <td>{formatDate(row.closing_date)}</td>
                      <td>{row.package_count}</td>
                      <td>{formatIdr(row.total_amount_idr)}</td>
                      <td>
                        {row.exception_count > 0 ? (
                          <span className="status-text warning">
                            {row.exception_count} kecuali
                          </span>
                        ) : (
                          <span className="status-text success">Bersih</span>
                        )}
                      </td>
                      <td>
                        <span className={statusTextClass(row.status)}>
                          {row.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>
                        <Link
                          className="button secondary"
                          href={`/shipping-history/${row.id}`}
                          style={{ padding: "6px 10px" }}
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={7} className="muted" style={{ textAlign: "center", padding: 30 }}>
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