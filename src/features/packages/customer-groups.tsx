"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { formatIdr, formatReceivedDate } from "@/lib/formatters";
import { packageStatusLabel } from "@/lib/package-status";
import { statusTextClass } from "@/lib/status-text";

type GroupPackage = {
  id: string;
  package_code: string;
  tracking_number: string;
  status: string;
  shipping_fee_idr: string | number;
  received_date: string;
  received_time: string | null;
};

export type CustomerGroup = {
  customer: { id: string; code: string; name: string } | null;
  packageCount: number;
  totalFee: number;
  packages: GroupPackage[];
};

export function CustomerGroups({
  groups,
  loading,
}: {
  groups: CustomerGroup[];
  loading: boolean;
}) {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {loading ? (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <tbody>
                <TableSkeleton columns={5} hasActionColumn />
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {groups.map((group, index) => {
            const isCollapsed = collapsed[index];
            return (
              <div className="card" key={group.customer?.id ?? index} style={{ overflow: "hidden" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "14px 18px",
                    cursor: "pointer",
                    flexWrap: "wrap",
                  }}
                  onClick={() =>
                    setCollapsed((current) => ({
                      ...current,
                      [index]: !isCollapsed,
                    }))
                  }
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {isCollapsed ? (
                      <ChevronRight size={17} className="muted" />
                    ) : (
                      <ChevronDown size={17} className="muted" />
                    )}
                    <strong>{group.customer?.name ?? "Tanpa Customer"}</strong>
                    {group.customer && (
                      <span className="badge">{group.customer.code}</span>
                    )}
                    <span className="muted" style={{ fontSize: 13 }}>
                      {group.packageCount} barang · {formatIdr(group.totalFee)}
                    </span>
                  </div>
                  {group.customer && (
                    <Link
                      className="button secondary"
                      href={`/customers/${group.customer.id}`}
                      onClick={(event) => event.stopPropagation()}
                      style={{ padding: "6px 10px" }}
                    >
                      Lihat Customer
                    </Link>
                  )}
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
                        {group.packages.map((row) => (
                          <tr key={row.id}>
                            <td>{row.package_code}</td>
                            <td>{row.tracking_number}</td>
                            <td>
                              <span className={statusTextClass(row.status)}>
                                {packageStatusLabel(row.status)}
                              </span>
                            </td>
                            <td>{formatIdr(row.shipping_fee_idr)}</td>
                            <td>
                              {formatReceivedDate(row.received_date, row.received_time)}
                            </td>
                            <td>
                              <Link
                                className="button secondary"
                                href={`/packages/${row.id}`}
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
          {!groups.length && (
            <div
              className="card muted"
              style={{ padding: 30, textAlign: "center" }}
            >
              Belum ada data.
            </div>
          )}
        </>
      )}
    </div>
  );
}
