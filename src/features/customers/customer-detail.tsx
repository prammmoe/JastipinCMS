"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Phone, User } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DetailPageSkeleton } from "@/components/ui/skeleton";
import { useSnackbar } from "@/components/ui/snackbar";
import { api } from "@/lib/api-client/client";
import { formatIdr, formatReceivedDate } from "@/lib/formatters";
import { packageStatusLabel } from "@/lib/package-status";
import { statusTextClass } from "@/lib/status-text";

type Customer = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

type HistoryPackage = {
  id: string;
  package_code: string;
  tracking_number: string;
  status: string;
  shipping_fee_idr: string | number;
  received_date: string;
  received_time: string | null;
};

const monthKey = (date: string) => date.slice(0, 7);

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function currentMonthKey() {
  const now = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).format(now);
}

export function CustomerDetail({ id }: { id: string }) {
  const snackbar = useSnackbar();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [history, setHistory] = useState<HistoryPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<Customer>(`/api/v1/customers/${id}`),
      api.get<HistoryPackage[]>(`/api/v1/customers/${id}/packages`),
    ])
      .then(([customerData, packages]) => {
        setCustomer(customerData);
        setHistory(packages);
      })
      .catch((value) =>
        snackbar.error(
          value instanceof Error ? value.message : "Gagal memuat data.",
        ),
      )
      .finally(() => setLoading(false));
  }, [id, snackbar]);

  useEffect(() => {
    load();
  }, [load]);

  const months = useMemo(() => {
    const grouped = new Map<string, HistoryPackage[]>();
    for (const item of history) {
      const key = monthKey(item.received_date);
      const bucket = grouped.get(key) ?? [];
      bucket.push(item);
      grouped.set(key, bucket);
    }
    return [...grouped.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [history]);

  const currentKey = currentMonthKey();
  const thisMonth = history.filter(
    (item) => monthKey(item.received_date) === currentKey,
  );
  const thisMonthFee = thisMonth.reduce(
    (sum, item) => sum + Number(item.shipping_fee_idr ?? 0),
    0,
  );

  const summary = [
    { label: "Total Barang", value: history.length },
    {
      label: "Barang Bulan Ini",
      value: thisMonth.length,
    },
    { label: "Total Biaya Bulan Ini", value: formatIdr(thisMonthFee) },
  ];

  return (
    <>
      <PageHeader
        title={customer?.name ?? "Customer"}
        description={customer ? `${customer.code} · bergabung ${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(customer.created_at))}` : "Memuat detail customer..."}
        actions={
          <Link className="button secondary" href="/customers">
            Kembali
          </Link>
        }
      />

      {loading ? (
        <DetailPageSkeleton />
      ) : (
        customer && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
                gap: 14,
                marginBottom: 20,
              }}
            >
              {summary.map((item) => (
                <div className="card" key={item.label} style={{ padding: 18 }}>
                  <div className="label">{item.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 18, marginBottom: 20 }}>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <User size={16} className="muted" />
                  <span>{customer.name}</span>
                </div>
                {customer.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Phone size={16} className="muted" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                <span className={statusTextClass(customer.is_active ? "ACTIVE" : "INACTIVE")}>{customer.is_active ? "Aktif" : "Nonaktif"}</span>
              </div>
              {customer.address && (
                <p className="muted" style={{ marginBottom: 0, marginTop: 10 }}>
                  {customer.address}
                </p>
              )}
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>
              Riwayat Paket
            </h2>
            {months.length ? (
              <div style={{ display: "grid", gap: 14 }}>
                {months.map(([key, items]) => {
                  const isCollapsed = collapsed[key];
                  const fee = items.reduce(
                    (sum, item) => sum + Number(item.shipping_fee_idr ?? 0),
                    0,
                  );
                  return (
                    <div className="card" key={key} style={{ overflow: "hidden" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: "14px 18px",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          setCollapsed((current) => ({
                            ...current,
                            [key]: !isCollapsed,
                          }))
                        }
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {isCollapsed ? (
                            <ChevronRight size={17} className="muted" />
                          ) : (
                            <ChevronDown size={17} className="muted" />
                          )}
                          <strong>{monthLabel(key)}</strong>
                          <span className="muted" style={{ fontSize: 13 }}>
                            {items.length} barang · {formatIdr(fee)}
                          </span>
                        </div>
                      </div>
                      {!isCollapsed && (
                        <div style={{ overflowX: "auto", borderTop: "1px solid var(--border)" }}>
                          <table>
                            <thead>
                              <tr>
                                <th>Kode</th>
                                <th>Nomor Resi</th>
                                <th>Status</th>
                                <th>Biaya</th>
                                <th>Diterima</th>
                                <th />
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item) => (
                                <tr key={item.id}>
                                  <td>{item.package_code}</td>
                                  <td>{item.tracking_number}</td>
                                  <td>
                                    <span className={statusTextClass(item.status)}>
                                      {packageStatusLabel(item.status)}
                                    </span>
                                  </td>
                                  <td>{formatIdr(item.shipping_fee_idr)}</td>
                                  <td>
                                    {formatReceivedDate(
                                      item.received_date,
                                      item.received_time,
                                    )}
                                  </td>
                                  <td>
                                    <Link
                                      className="button secondary"
                                      href={`/packages/${item.id}`}
                                      style={{ padding: "6px 10px" }}
                                    >
                                      Detail
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card muted" style={{ padding: 30, textAlign: "center" }}>
                Belum ada paket untuk customer ini.
              </div>
            )}
          </>
        )
      )}
    </>
  );
}