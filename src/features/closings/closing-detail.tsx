"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client/client";
import { DetailPageSkeleton } from "@/components/ui/skeleton";
import { useSnackbar } from "@/components/ui/snackbar";
import { formatDate, formatIdr } from "@/lib/formatters";
import { statusTextClass } from "@/lib/status-text";
import type { Actor } from "@/types/domain";

type PackageRow = {
  package_id: string;
  is_active: boolean;
  merauke_check_status: "PENDING" | "OK" | "DAMAGED" | "MISSING" | null;
  merauke_notes: string | null;
  packages: {
    id: string;
    package_code: string;
    tracking_number: string;
    shipping_fee_idr: string;
    status: string;
    customers?: { id: string; code: string; name: string } | null;
  };
};

type CustomerGroup = {
  key: string;
  customer: { id: string; code: string; name: string } | null;
  packages: PackageRow[];
};

type Closing = {
  id: string;
  code: string;
  status: string;
  closing_date: string;
  total_amount_idr: string;
  merauke_progress: string;
  customer_groups: CustomerGroup[];
};

const CONDITION_LABEL: Record<string, string> = {
  PENDING: "Belum dicek",
  OK: "OK",
  DAMAGED: "Rusak",
  MISSING: "Hilang",
};

const CONDITION_CLASS: Record<string, string> = {
  PENDING: "status-text",
  OK: "status-text success",
  DAMAGED: "status-text warning",
  MISSING: "status-text danger",
};

export function ClosingDetail({ id }: { id: string }) {
  const snackbar = useSnackbar();
  const [closing, setClosing] = useState<Closing>();
  const [user, setUser] = useState<Actor>();
  const [selected, setSelected] = useState<string[]>([]);
  const [condition, setCondition] = useState("OK");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () =>
      Promise.all([
        api.get<Closing>(`/api/v1/closings/${id}`),
        api.get<Actor>("/api/v1/auth/me").catch(() => undefined),
      ]).then(([closingValue, userValue]) => {
        setClosing(closingValue);
        setUser(userValue);
      }),
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const canCrosscheck = user?.role === "ADMIN" || user?.role === "STAFF_MERAUKE";
  const canCancel = user?.role === "ADMIN";

  const toggle = (packageId: string) =>
    setSelected((current) =>
      current.includes(packageId)
        ? current.filter((item) => item !== packageId)
        : [...current, packageId],
    );

  async function crosscheck() {
    if (!selected.length) return;
    setBusy(true);
    try {
      await api.post(`/api/v1/closings/${id}/merauke-check`, {
        packageIds: selected,
        condition,
        notes,
      });
      snackbar.success("Hasil cek Merauke tersimpan.");
      setSelected([]);
      setNotes("");
      await load();
    } catch (value) {
      snackbar.error(
        value instanceof Error ? value.message : "Gagal menyimpan.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    const reason = window.prompt("Alasan pembatalan:");
    if (reason === null) return;
    setBusy(true);
    try {
      await api.post(`/api/v1/closings/${id}/cancel`, { reason });
      snackbar.success("Closing dibatalkan.");
      await load();
    } catch (value) {
      snackbar.error(
        value instanceof Error ? value.message : "Gagal membatalkan.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!closing) return <DetailPageSkeleton />;
  const pendingPackages = closing.customer_groups
    .flatMap((group) => group.packages)
    .filter((item) => item.merauke_check_status === "PENDING");

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link className="button ghost" href="/closings" style={{ padding: "6px 8px" }}>
              ←
            </Link>
            <h1>{closing.code}</h1>
            <span className={statusTextClass(closing.status)}>
              {closing.status.replaceAll("_", " ")}
            </span>
          </div>
          <p className="muted" style={{ marginTop: 4 }}>
            {formatDate(closing.closing_date)} · {closing.merauke_progress} paket
            dicek Merauke
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
          {canCancel && closing.status !== "COMPLETED" && (
            <button className="button secondary" onClick={cancel} disabled={busy}>
              Batalkan
            </button>
          )}
        </div>
      </div>

      {canCrosscheck && pendingPackages.length > 0 && (
        <div className="card" style={{ padding: 18, margin: "18px 0" }}>
          <h3>Crosscheck Merauke</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            Pilih paket pada daftar di bawah, lalu isi kondisi hasil pengecekan.
          </p>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: 12,
            }}
          >
            <select
              className="input"
              value={condition}
              onChange={(event) => setCondition(event.target.value)}
              style={{ width: 160 }}
            >
              <option value="OK">OK</option>
              <option value="DAMAGED">Rusak</option>
              <option value="MISSING">Hilang</option>
            </select>
            <input
              className="input"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Catatan (opsional)"
              style={{ flex: 1, minWidth: 200 }}
            />
            <button
              className="button"
              onClick={crosscheck}
              disabled={!selected.length || busy}
            >
              Simpan ({selected.length})
            </button>
          </div>
        </div>
      )}

      {closing.customer_groups.map((group) => (
        <div className="card" style={{ overflow: "hidden", marginTop: 18 }} key={group.key}>
          <div
            style={{
              padding: "13px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <strong style={{ fontSize: 14 }}>
              {group.customer?.name ?? "Tanpa customer"}
            </strong>
            <span className="muted" style={{ fontSize: 13 }}>
              {group.packages.length} paket
            </span>
          </div>
          <table>
            <thead>
              <tr>
                {canCrosscheck && <th style={{ width: 34 }} />}
                <th>Paket</th>
                <th>Resi</th>
                <th>Biaya</th>
                <th>Hasil Cek</th>
              </tr>
            </thead>
            <tbody>
              {group.packages.map((item) => (
                <tr key={item.package_id}>
                  {canCrosscheck && (
                    <td>
                      <input
                        type="checkbox"
                        disabled={
                          item.merauke_check_status !== "PENDING" || busy
                        }
                        checked={selected.includes(item.package_id)}
                        onChange={() => toggle(item.package_id)}
                      />
                    </td>
                  )}
                  <td>
                    <Link
                      href={`/packages/${item.packages.id}`}
                      style={{ fontWeight: 600 }}
                    >
                      {item.packages.package_code}
                    </Link>
                  </td>
                  <td>{item.packages.tracking_number}</td>
                  <td>{formatIdr(item.packages.shipping_fee_idr)}</td>
                  <td>
                    <span
                      className={
                        CONDITION_CLASS[item.merauke_check_status ?? "PENDING"]
                      }
                    >
                      {CONDITION_LABEL[item.merauke_check_status ?? "PENDING"]}
                    </span>
                    {item.merauke_notes && (
                      <div className="muted" style={{ fontSize: 12 }}>
                        {item.merauke_notes}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="card" style={{ padding: 18, marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <strong>Total closing</strong>
          <strong style={{ fontSize: 16 }}>
            {formatIdr(closing.total_amount_idr)}
          </strong>
        </div>
      </div>
    </>
  );
}