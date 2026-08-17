"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client/client";
import { useSnackbar } from "@/components/ui/snackbar";
import { formatDate } from "@/lib/formatters";
import { formatIdr } from "@/lib/formatters";
import {
  closingCheckedCount,
  closingStatusClass,
  closingStatusLabel,
} from "@/lib/closing-status";

type ClosingRow = {
  id: string;
  code: string;
  closing_date: string;
  status: string;
  package_count: number;
  total_amount_idr: string | number;
  merauke_progress: string;
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

export function ClosingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const snackbar = useSnackbar();
  const [rows, setRows] = useState<ClosingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [month, setMonth] = useState(() => searchParams.get("month") ?? "");

  const load = useCallback(() => {
    const query = new URLSearchParams({ pageSize: "50" });
    if (search) query.set("search", search);
    if (month) {
      const [year, num] = month.split("-").map(Number);
      const lastDay = new Date(Date.UTC(year, num, 0)).getUTCDate();
      query.set("from", `${month}-01`);
      query.set("to", `${month}-${String(lastDay).padStart(2, "0")}`);
    }
    setLoading(true);
    api
      .get<ClosingRow[]>(`/api/v1/closings?${query}`)
      .then(setRows)
      .catch((value) =>
        snackbar.error(
          value instanceof Error ? value.message : "Gagal memuat data.",
        ),
      )
      .finally(() => setLoading(false));
  }, [search, month, snackbar]);

  useEffect(() => {
    const timer = window.setTimeout(load, 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (month) params.set("month", month);
    const query = params.toString();
    router.replace(query ? `/closings?${query}` : "/closings", {
      scroll: false,
    });
  }, [search, month, router]);

  return (
    <>
      <PageHeader title="Closing" description="Paket menunggu ACC Merauke." />
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
            Closing Surabaya ({rows.length})
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
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Tanggal</th>
                <th>Paket</th>
                <th>Total</th>
                <th>Merauke</th>
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
                      <td>{row.merauke_progress}</td>
                      <td>
                        <span
                          className={closingStatusClass(row.status)}
                        >
                          {closingStatusLabel(
                            row.status,
                            closingCheckedCount(row.merauke_progress),
                          )}
                        </span>
                      </td>
                      <td>
                        <Link
                          className="button secondary"
                          href={`/closings/${row.id}`}
                          style={{ padding: "6px 10px" }}
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td
                        colSpan={7}
                        className="muted"
                        style={{ textAlign: "center", padding: 30 }}
                      >
                        Belum ada closing.
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
