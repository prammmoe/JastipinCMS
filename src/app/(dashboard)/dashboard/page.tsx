"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/lib/api-client/client";
import { formatIdr } from "@/lib/formatters";

type Metrics = {
  receivedToday: number;
  waitingClosing: number;
  readyToShip: number;
  inTransit: number;
  readyForPickup: number;
  outstandingIdr: string;
};

export default function Dashboard() {
  const [data, setData] = useState<Metrics>();

  useEffect(() => {
    api.get<Metrics>("/api/v1/dashboard").then(setData);
  }, []);

  const cards = [
    "Paket diterima hari ini",
    "Menunggu closing",
    "Siap dikirim",
    "Dalam perjalanan",
    "Siap diambil",
    "Piutang belum lunas",
  ];
  const values = data
    ? [
        data.receivedToday,
        data.waitingClosing,
        data.readyToShip,
        data.inTransit,
        data.readyForPickup,
        formatIdr(data.outstandingIdr),
      ]
    : Array(6).fill("—");

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Ringkasan operasional JASTIPin hari ini."
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
          gap: 14,
        }}
      >
        {cards.map((label, index) => (
          <div className="card" key={label} style={{ padding: 20 }}>
            <div className="muted" style={{ fontSize: 12, fontWeight: 500 }}>
              {label}
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 27,
                lineHeight: 1.2,
                fontWeight: 600,
                letterSpacing: "-0.04em",
              }}
            >
              {values[index]}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
