"use client";
/* eslint-disable react-hooks/exhaustive-deps */
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api-client/client";
import { formatIdr } from "@/lib/formatters";
export function ReportPage({ type }: { type: "operational" | "financial" }) {
  const [data, setData] = useState<Record<string, unknown>>({});
  const load = (from = "", to = "") =>
    api
      .get<
        Record<string, unknown>
      >(`/api/v1/reports/${type}?dateFrom=${from}&dateTo=${to}`)
      .then(setData);
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
  );
}
