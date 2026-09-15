"use client";

import Link from "next/link";
import { formatDate } from "@/lib/formatters";
import type { ActiveClosing } from "@/types/dashboard";

export function ClosingProgressCard({
  closing,
}: {
  closing: ActiveClosing;
}) {
  return (
    <Link
      className="card dashboard-closing-card"
      href={`/closings/${closing.id}`}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div>
          <strong style={{ fontSize: 14 }}>{closing.code}</strong>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            {formatDate(closing.closingDate)}
          </div>
        </div>
        <span className="status-text success">{closing.progress}%</span>
      </div>
      <div className="dashboard-progress">
        <div
          className="dashboard-progress-fill"
          style={{ width: `${closing.progress}%` }}
        />
      </div>
      <div
        className="muted"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 10,
          fontSize: 12,
        }}
      >
        <span>
          {closing.checkedCount}/{closing.packageCount} paket cek
        </span>
        <span>{closing.pendingCount} pending</span>
        <span>{closing.customerCount} customer</span>
      </div>
    </Link>
  );
}