"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCcw, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/lib/api-client/client";
import { formatIdr, formatReceivedDate } from "@/lib/formatters";
import { PACKAGE_STATUSES, packageStatusLabel } from "@/lib/package-status";

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

export function PackagesPage() {
  const [rows, setRows] = useState<PackageRow[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("received_desc");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const query = new URLSearchParams({ pageSize: "50", search, sort });
    if (dateFrom) query.set("dateFrom", dateFrom);
    if (dateTo) query.set("dateTo", dateTo);
    if (status) query.set("status", status);
    setError("");
    api
      .get<PackageRow[]>(`/api/v1/packages?${query}`)
      .then(setRows)
      .catch((value) =>
        setError(value instanceof Error ? value.message : "Gagal memuat data."),
      );
  }, [dateFrom, dateTo, search, sort, status]);

  useEffect(() => {
    const timer = window.setTimeout(load, 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <>
      <PageHeader
        title="Semua Barang"
        description="Cari, filter, dan urutkan seluruh paket."
      />
      <div className="card" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: 18,
            display: "grid",
            gridTemplateColumns: "minmax(220px,2fr) repeat(4,minmax(150px,1fr)) auto",
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
                placeholder="Kode atau nomor resi"
                style={{ paddingLeft: 38 }}
              />
            </span>
          </label>
          <label>
            <span className="label">Dari tanggal</span>
            <input className="input" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label>
            <span className="label">Sampai tanggal</span>
            <input className="input" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
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
              <option value="received_desc">Terbaru</option>
              <option value="received_asc">Terlama</option>
              <option value="fee_desc">Biaya terbesar</option>
              <option value="fee_asc">Biaya terkecil</option>
            </select>
          </label>
          <button className="button secondary" onClick={load} aria-label="Muat ulang">
            <RefreshCcw size={16} />
          </button>
        </div>
        {error && <div className="feedback error" style={{ margin: 16 }}>{error}</div>}
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>Kode</th><th>Nomor Resi</th><th>Customer</th><th>Status</th><th>Biaya</th><th>Diterima</th><th /></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.package_code}</td>
                  <td>{row.tracking_number}</td>
                  <td>{row.customers?.name ?? "—"}</td>
                  <td><span className="badge">{packageStatusLabel(row.status)}</span></td>
                  <td>{formatIdr(row.shipping_fee_idr)}</td>
                  <td>{formatReceivedDate(row.received_date, row.received_time)}</td>
                  <td><Link className="button secondary" href={`/packages/${row.id}`} style={{ padding: "6px 10px" }}>Detail</Link></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={7} className="muted" style={{ textAlign: "center", padding: 30 }}>Belum ada data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
