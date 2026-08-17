"use client";

import Link from "next/link";
import { AGING } from "@/lib/aging";

const ROWS = [
  {
    label: `Belum closing > ${AGING.waitingClosingDays} hari`,
    key: "waitingClosingOverThreshold",
    href: "/packages?status=WAITING_CLOSING",
    danger: true,
  },
  {
    label: `Menunggu Merauke > ${AGING.waitingMeraukeDays} hari`,
    key: "waitingMeraukeOverThreshold",
    href: "/closings",
    danger: true,
  },
] as const;

export function AgingSummary({
  aging,
}: {
  aging: {
    waitingClosingOverThreshold: number;
    waitingMeraukeOverThreshold: number;
  };
}) {
  return (
    <section className="card dashboard-panel">
      <header className="dashboard-panel-header">
        <h3>Aging</h3>
        <span className="muted" style={{ fontSize: 12 }}>
          butuh tindakan
        </span>
      </header>
      <ul className="dashboard-list">
        {ROWS.map((row) => (
          <li key={row.key}>
            <Link href={row.href} className="dashboard-row">
              <span className="muted">{row.label}</span>
              <span
                className={row.danger ? "status-text danger" : "status-text"}
              >
                {aging[row.key]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
