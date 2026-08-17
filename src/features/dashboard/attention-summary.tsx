"use client";

import Link from "next/link";
import { statusTextClass } from "@/lib/status-text";

const ROWS = [
  { key: "damaged", label: "Rusak", href: "/packages?status=DAMAGED" },
  { key: "missing", label: "Hilang", href: "/packages?status=MISSING" },
  { key: "hold", label: "Ditahan", href: "/packages?status=HOLD" },
] as const;

export function AttentionSummary({
  attention,
}: {
  attention: { damaged: number; missing: number; hold: number };
}) {
  const total = attention.damaged + attention.missing + attention.hold;
  return (
    <section className="card dashboard-panel">
      <header className="dashboard-panel-header">
        <h3>Perlu Perhatian</h3>
        <span className="status-text danger">{total}</span>
      </header>
      <ul className="dashboard-list">
        {ROWS.map((row) => (
          <li key={row.key}>
            <Link href={row.href} className="dashboard-row">
              <span className="muted">{row.label}</span>
              <span className={statusTextClass(row.key.toUpperCase())}>
                {attention[row.key]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
