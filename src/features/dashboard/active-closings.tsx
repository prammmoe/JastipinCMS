"use client";

import Link from "next/link";
import type { ActiveClosing } from "@/types/dashboard";
import { ClosingProgressCard } from "./closing-progress-card";

export function ActiveClosings({ closings }: { closings: ActiveClosing[] }) {
  return (
    <section className="card dashboard-panel">
      <header className="dashboard-panel-header">
        <h3>Closing Aktif</h3>
        <Link href="/closings" className="muted" style={{ fontSize: 12 }}>
          Lihat semua
        </Link>
      </header>
      {closings.length ? (
        <div className="dashboard-closing-grid">
          {closings.map((closing) => (
            <ClosingProgressCard key={closing.id} closing={closing} />
          ))}
        </div>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          Belum ada closing aktif.
        </p>
      )}
    </section>
  );
}