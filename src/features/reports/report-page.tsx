"use client";
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api-client/client";
import { formatIdr } from "@/lib/formatters";
import { MetricCardsSkeleton, Skeleton } from "@/components/ui/skeleton";
export function ReportPage({ type }: { type: "operational" | "financial" }) {
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const load = (from = "", to = "") => {
    setLoading(true);
    return api
      .get<
        Record<string, unknown>
      >(`/api/v1/reports/${type}?dateFrom=${from}&dateTo=${to}`)
      .then(setData)
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    load(String(form.get("from") ?? ""), String(form.get("to") ?? ""));
  }
  const labels: Record<string, string> = {
    packageCount: "Jumlah Paket",
    totalActualWeightKg: "Berat Aktual (kg)",
    totalChargeableWeightKg: "Berat Tagihan (kg)",
    revenueIdr: "Revenue",
    collectedIdr: "Pembayaran Diterima",
    outstandingIdr: "Piutang",
    expensesIdr: "Pengeluaran",
    recordedGrossProfitIdr: "Recorded Gross Profit",
  };
  return (
    <>
      <h1>Laporan {type === "financial" ? "Keuangan" : "Operasional"}</h1>
      <form
        className="card"
        onSubmit={filter}
        style={{ padding: 16, display: "flex", gap: 12, marginBottom: 18 }}
      >
        <input className="input" type="date" name="from" />
        <input className="input" type="date" name="to" />
        <button className="button">Terapkan</button>
      </form>
      {loading ? (
        <>
          <MetricCardsSkeleton count={type === "financial" ? 6 : 4} />
          {type === "operational" && (
            <div className="card" style={{ padding: 20, marginTop: 18 }}>
              <Skeleton style={{ height: 16, width: 120, marginBottom: 16 }} />
              <Skeleton style={{ height: 120, width: "100%" }} />
            </div>
          )}
        </>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 16,
            }}
          >
            {Object.entries(data)
              .filter(([key]) => key !== "byStatus")
              .map(([key, value]) => (
                <div className="card" style={{ padding: 20 }} key={key}>
                  <div className="muted">{labels[key] ?? key}</div>
                  <strong style={{ display: "block", fontSize: 26, marginTop: 10 }}>
                    {key.endsWith("Idr") ? formatIdr(String(value)) : String(value)}
                  </strong>
                </div>
              ))}
          </div>
          {data.byStatus && (
            <div className="card" style={{ padding: 20, marginTop: 18 }}>
              <h3>Status Paket</h3>
              <pre>{JSON.stringify(data.byStatus, null, 2)}</pre>
            </div>
          )}
        </>
      )}
    </>
  );
}
