"use client";
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client/client";
import { DetailPageSkeleton } from "@/components/ui/skeleton";
import { formatIdr } from "@/lib/formatters";
import { statusTextClass } from "@/lib/status-text";

type Pkg = {
  id: string;
  package_code: string;
  tracking_number: string;
  shipping_fee_idr: string;
  customers?: { name: string };
};

type Closing = {
  id: string;
  code: string;
  status: string;
  total_amount_idr: string;
  closing_packages: { package_id: string; packages: Pkg }[];
};

export function ClosingDetail({ id }: { id: string }) {
  const [closing, setClosing] = useState<Closing>();
  const [eligible, setEligible] = useState<Pkg[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const load = () =>
    Promise.all([
      api.get<Closing>(`/api/v1/closings/${id}`),
      api.get<Pkg[]>("/api/v1/packages?pageSize=100&status=WAITING_CLOSING"),
    ]).then(([c, p]) => {
      setClosing(c);
      setEligible(
        p.filter(
          (item) => !c.closing_packages.some((cp) => cp.package_id === item.id),
        ),
      );
    });

  useEffect(() => {
    load();
  }, [id]);

  async function add() {
    await api.post(`/api/v1/closings/${id}/packages`, { packageIds: selected });
    setSelected([]);
    load();
  }

  async function action(name: string, body: unknown = {}) {
    try {
      await api.post(`/api/v1/closings/${id}/${name}`, body);
      setMessage("Tindakan berhasil.");
      load();
    } catch (value) {
      setMessage(value instanceof Error ? value.message : "Tindakan gagal.");
    }
  }

  if (!closing) return <DetailPageSkeleton />;
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          gap: 16,
        }}
      >
        <div>
          <h1>{closing.code}</h1>
          <span className={statusTextClass(closing.status)}>{closing.status.replaceAll("_", " ")}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a
            className="button secondary"
            href={`/api/v1/closings/${id}/export?format=pdf`}
          >
            PDF
          </a>
          <a
            className="button secondary"
            href={`/api/v1/closings/${id}/export?format=xlsx`}
          >
            XLSX
          </a>
          {closing.status === "DRAFT" && (
            <button className="button" onClick={() => action("finalize")}>
              Finalisasi
            </button>
          )}
        </div>
      </div>
      {message && <p>{message}</p>}
      {closing.status === "DRAFT" && (
        <div className="card" style={{ padding: 18, margin: "18px 0" }}>
          <h3>Tambahkan Paket</h3>
          <div style={{ maxHeight: 240, overflow: "auto" }}>
            {eligible.map((pkg) => (
              <label
                key={pkg.id}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: 9,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(pkg.id)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...selected, pkg.id]
                        : selected.filter((v) => v !== pkg.id),
                    )
                  }
                />
                {pkg.package_code} — {pkg.tracking_number} —{" "}
                {pkg.customers?.name ?? "Tanpa customer"}
              </label>
            ))}
          </div>
          <button
            className="button"
            onClick={add}
            disabled={!selected.length}
            style={{ marginTop: 12 }}
          >
            Tambahkan Pilihan
          </button>
        </div>
      )}
      <div className="card" style={{ overflow: "hidden", marginTop: 18 }}>
        <table>
          <thead>
            <tr>
              <th>Paket</th>
              <th>Resi</th>
              <th>Customer</th>
              <th>Biaya</th>
            </tr>
          </thead>
          <tbody>
            {closing.closing_packages.map((cp) => (
              <tr key={cp.package_id}>
                <td>{cp.packages.package_code}</td>
                <td>{cp.packages.tracking_number}</td>
                <td>{cp.packages.customers?.name}</td>
                <td>{formatIdr(cp.packages.shipping_fee_idr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: 18, textAlign: "right", fontWeight: 800 }}>
          Total: {formatIdr(closing.total_amount_idr)}
        </div>
      </div>
    </>
  );
}
