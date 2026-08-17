"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function IncomingTrendChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  return (
    <section className="card dashboard-panel">
      <header className="dashboard-panel-header">
        <h3>Tren Barang Masuk</h3>
        <span className="muted" style={{ fontSize: 12 }}>
          30 hari terakhir
        </span>
      </header>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "var(--muted)" }}
              tickFormatter={(value) => value.slice(5)}
              tickMargin={8}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted)" }}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value) => [`${value} paket`, "Barang masuk"]}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ r: 2, fill: "var(--primary)" }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}