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
        label="Total Barang Masuk"
        value={summary.totalReceived}
        href="/packages"
      />
      <DashboardStatCard
        label="Belum closing"
        value={summary.waitingClosing}
        href="/packages"
      />
      <DashboardStatCard
        label="Total Closing"
        value={summary.meraukeApproved}
        href="/shipping-history"
      />
    </div>
  );
}