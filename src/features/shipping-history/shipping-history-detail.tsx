"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client/client";
import { DetailPageSkeleton } from "@/components/ui/skeleton";
import { useSnackbar } from "@/components/ui/snackbar";
import { formatDate, formatIdr } from "@/lib/formatters";
import { packageStatusLabel } from "@/lib/package-status";
import { statusTextClass } from "@/lib/status-text";

type PackageRow = {
  package_id: string;
  is_active: boolean;
  merauke_check_status: "PENDING" | "OK" | "DAMAGED" | "MISSING" | null;
  merauke_notes: string | null;
  packages: {
    id: string;
    package_code: string;
    tracking_number: string;
    shipping_fee_idr: string;
    customers?: { id: string; code: string; name: string } | null;
  };
};

type CustomerGroup = {
  key: string;
  customer: { id: string; code: string; name: string } | null;
  packages: PackageRow[];
};

type Closing = {
  id: string;
  code: string;
  status: string;
  closing_date: string;
  total_amount_idr: string;
  merauke_progress: string;
  customer_groups: CustomerGroup[];
};

const CONDITION_LABEL: Record<string, string> = {
  PENDING: "Belum dicek",
  OK: "OK",
  DAMAGED: "Rusak",
  MISSING: "Hilang",
};

const CONDITION_CLASS: Record<string, string> = {
  PENDING: "status-text",
  OK: "status-text success",
  DAMAGED: "status-text warning",
  MISSING: "status-text danger",
};

export function ShippingHistoryDetail({ id }: { id: string }) {
  const snackbar = useSnackbar();
  const [closing, setClosing] = useState<Closing>();

  useEffect(() => {
    api
      .get<Closing>(`/api/v1/shipping-history/${id}`)
      .then(setClosing)
      .catch((value) =>
        snackbar.error(
          value instanceof Error ? value.message : "Gagal memuat data.",
        ),
      );
  }, [id, snackbar]);

  if (!closing) return <DetailPageSkeleton />;
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link
              className="button ghost"
              href="/shipping-history"
              style={{ padding: "6px 8px" }}
            >
              ←
            </Link>
            <h1>{closing.code}</h1>
            <span className={statusTextClass(closing.status)}>
              {packageStatusLabel(closing.status)}
            </span>
          </div>
          <p className="muted" style={{ marginTop: 4 }}>
            {formatDate(closing.closing_date)} · {closing.merauke_progress} paket
            dicek Merauke
          </p>
        </div>
      </div>

      {closing.customer_groups.map((group) => (
        <div className="card" style={{ overflow: "hidden", marginTop: 18 }} key={group.key}>
          <div
            style={{
              padding: "13px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <strong style={{ fontSize: 14 }}>
              {group.customer?.name ?? "Tanpa customer"}
            </strong>
            <span className="muted" style={{ fontSize: 13 }}>
              {group.packages.length} paket
            </span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Paket</th>
                <th>Resi</th>
                <th>Biaya</th>
                <th>Hasil Cek</th>
              </tr>
            </thead>
            <tbody>
              {group.packages.map((item) => (
                <tr key={item.package_id}>
                  <td>
                    <Link href={`/packages/${item.packages.id}`} style={{ fontWeight: 600 }}>
                      {item.packages.package_code}
                    </Link>
                  </td>
                  <td>{item.packages.tracking_number}</td>
                  <td>{formatIdr(item.packages.shipping_fee_idr)}</td>
                  <td>
                    <span
                      className={
                        CONDITION_CLASS[item.merauke_check_status ?? "PENDING"]
                      }
                    >
                      {CONDITION_LABEL[item.merauke_check_status ?? "PENDING"]}
                    </span>
                    {item.merauke_notes && (
                      <div className="muted" style={{ fontSize: 12 }}>
                        {item.merauke_notes}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="card" style={{ padding: 18, marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <strong>Total closing</strong>
          <strong style={{ fontSize: 16 }}>
            {formatIdr(closing.total_amount_idr)}
          </strong>
        </div>
      </div>
    </>
  );
}