"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { useSnackbar } from "@/components/ui/snackbar";
import { api } from "@/lib/api-client/client";
import type { DashboardData } from "@/types/dashboard";
import { ActiveClosings } from "./active-closings";
import { AgingSummary } from "./aging-summary";
import { AttentionSummary } from "./attention-summary";
import { DashboardSummary } from "./dashboard-summary";
import { IncomingTrendChart } from "./incoming-trend-chart";

export default function DashboardPage() {
  const snackbar = useSnackbar();
  const [data, setData] = useState<DashboardData>();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    api
      .get<DashboardData>("/api/v1/dashboard")
      .then((value) => {
        if (active) setData(value);
      })
      .catch((error) => {
        if (!active) return;
        snackbar.error(
          error instanceof Error ? error.message : "Gagal memuat dashboard.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt, snackbar]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Ringkasan operasional JASTIPin hari ini."
      />
      {loading ? (
        <DashboardSkeleton />
      ) : data ? (
        <>
          <DashboardSummary summary={data.summary} />
          <div className="dashboard-sections">
            <AttentionSummary attention={data.attention} />
            <AgingSummary aging={data.aging} />
          </div>
          <div style={{ marginTop: 16 }}>
            <ActiveClosings closings={data.activeClosings} />
          </div>
          <div style={{ marginTop: 16 }}>
            <IncomingTrendChart data={data.incomingTrend} />
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 24 }}>
          <p style={{ margin: "0 0 12px" }}>Gagal memuat dashboard.</p>
          <button
            className="button secondary"
            onClick={() => {
              setLoading(true);
              setAttempt((value) => value + 1);
            }}
          >
            Coba lagi
          </button>
        </div>
      )}
    </>
  );
}