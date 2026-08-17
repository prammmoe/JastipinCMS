"use client";

import type { DashboardSummary } from "@/types/dashboard";
import { DashboardStatCard } from "./dashboard-stat-card";

export function DashboardSummary({
  summary,
}: {
  summary: DashboardSummary;
}) {
  return (
    <div className="dashboard-summary-grid">
      <DashboardStatCard
        label="Barang masuk hari ini"
        value={summary.receivedToday}
        href="/packages?preset=today"
      />
      <DashboardStatCard
        label="Belum closing"
        value={summary.waitingClosing}
        href="/packages"
      />
      <DashboardStatCard
        label="Menunggu ACC Merauke"
        value={summary.waitingMerauke}
        href="/closings"
      />
      <DashboardStatCard
        label="Closing Merauke hari ini"
        value={summary.meraukeCompletedToday}
        hint="barang tervalidasi"
      />
      <DashboardStatCard
        label="Perlu perhatian"
        value={summary.attentionCount}
        href="/packages?attention=true"
        tone={summary.attentionCount > 0 ? "danger" : "default"}
      />
    </div>
  );
}
