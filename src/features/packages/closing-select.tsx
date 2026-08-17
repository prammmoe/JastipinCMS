"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { api } from "@/lib/api-client/client";
import { useSnackbar } from "@/components/ui/snackbar";
import { formatReceivedDate } from "@/lib/formatters";

type EligiblePackage = {
  id: string;
  package_code: string;
  tracking_number: string;
  received_date: string;
  received_time: string | null;
  shipping_fee_idr: string | number;
};

type EligibleGroup = {
  customer: { id: string; code: string; name: string } | null;
  eligibleCount: number;
  eligiblePackageIds: string[];
  packages: EligiblePackage[];
};

type Props = {
  search: string;
  dateFrom: string;
  dateTo: string;
  onExit: () => void;
};

const toDateInput = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);

export function ClosingSelect({ search, dateFrom, dateTo, onExit }: Props) {
  const snackbar = useSnackbar();
  const router = useRouter();
  const [groups, setGroups] = useState<EligibleGroup[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [closingDate, setClosingDate] = useState(() => toDateInput(new Date()));
  const [notes, setNotes] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const query = new URLSearchParams({
      pageSize: "50",
      groupBy: "customer",
    });
    if (search) query.set("search", search);
    if (dateFrom) query.set("dateFrom", dateFrom);
    if (dateTo) query.set("dateTo", dateTo);
    setLoading(true);
    api
      .getPaged<EligibleGroup[]>(`/api/v1/packages/closing-eligible?${query}`)
      .then(({ data, meta }) => {
        setGroups(data);
        setTotal(meta?.total ?? 0);
      })
      .catch((value) =>
        snackbar.error(
          value instanceof Error ? value.message : "Gagal memuat data.",
        ),
      )
      .finally(() => setLoading(false));
  }, [search, dateFrom, dateTo, snackbar]);

  const customerKey = (group: EligibleGroup) =>
    group.customer?.id ?? "__none__";

  const toggleCustomer = (group: EligibleGroup, on: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      for (const id of group.eligiblePackageIds) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const togglePackage = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selected.size;
  const selectedCustomers = useMemo(
    () =>
      groups.filter((group) =>
        group.eligiblePackageIds.every((id) => selected.has(id)),
      ).length,
    [groups, selected],
  );

  async function save() {
    if (!selectedCount) return;
    setBusy(true);
    try {
      const closingId = await api.post<string>("/api/v1/closings/save-surabaya", {
        closingDate,
        packageIds: [...selected],
        notes,
      });
      router.push(`/closings/${closingId}`);
    } catch (value) {
      snackbar.error(
        value instanceof Error ? value.message : "Gagal menyimpan closing.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div
        style={{
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          borderBottom: "1px solid var(--border)",
          background: "var(--accent-muted)",
        }}
      >
        <div>
          <strong style={{ fontSize: 14 }}>Pilih paket untuk Closing Surabaya</strong>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            {total} paket siap closing · pilih per customer untuk mengambil seluruh
            paketnya
          </div>
        </div>
        <button className="button ghost" onClick={onExit} style={{ minHeight: 34, padding: "6px 10px" }}>
          <X size={15} />
          Batal
        </button>
      </div>

      <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
        {loading ? (
          <div className="muted" style={{ padding: 30, textAlign: "center" }}>
            Memuat paket yang siap closing...
          </div>
        ) : (
          groups.map((group) => {
            const key = customerKey(group);
            const all = group.eligiblePackageIds.every((id) => selected.has(id));
            const some = group.eligiblePackageIds.some((id) => selected.has(id));
            return (
              <div key={key} style={{ borderBottom: "1px solid var(--border)" }}>
                <div
                  style={{
                    padding: "12px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "var(--neutral-50)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={all}
                    ref={(node) => {
                      if (node) node.indeterminate = !all && some;
                    }}
                    onChange={(event) => toggleCustomer(group, event.target.checked)}
                  />
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 14 }}>
                      {group.customer?.name ?? "Tanpa customer"}
                    </strong>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {group.eligibleCount} paket · Rp
                      {group.packages
                        .reduce(
                          (sum, pkg) => sum + Number(pkg.shipping_fee_idr ?? 0),
                          0,
                        )
                        .toLocaleString("id-ID")}
                    </div>
                  </div>
                  <button
                    className="button ghost"
                    style={{ minHeight: 32, padding: "5px 10px", fontSize: 12 }}
                    onClick={() => toggleCustomer(group, !all)}
                  >
                    {all ? "Batalkan semua" : "Pilih semua"}
                  </button>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 34 }} />
                        <th>Kode</th>
                        <th>Nomor Resi</th>
                        <th>Biaya</th>
                        <th>Diterima</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.packages.map((pkg) => (
                        <tr key={pkg.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selected.has(pkg.id)}
                              onChange={() => togglePackage(pkg.id)}
                            />
                          </td>
                          <td>{pkg.package_code}</td>
                          <td>{pkg.tracking_number}</td>
                          <td>
                            {Number(pkg.shipping_fee_idr ?? 0).toLocaleString("id-ID")}
                          </td>
                          <td>{formatReceivedDate(pkg.received_date, pkg.received_time)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
        {!loading && !groups.length && (
          <div className="muted" style={{ padding: 30, textAlign: "center" }}>
            Tidak ada paket yang siap closing dengan filter ini.
          </div>
        )}
      </div>

      <div
        style={{
          position: "sticky",
          bottom: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          padding: "14px 18px",
          borderTop: "1px solid var(--border)",
          background: "rgba(255,255,255,0.98)",
          boxShadow: "0 -8px 24px rgba(10,10,10,0.06)",
        }}
      >
        <strong style={{ fontSize: 13, whiteSpace: "nowrap" }}>
          {selectedCount} paket dari {selectedCustomers} customer
        </strong>
        <label style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
          <span className="muted" style={{ fontSize: 12 }}>Tanggal</span>
          <input
            className="input"
            type="date"
            value={closingDate}
            onChange={(event) => setClosingDate(event.target.value)}
            style={{ width: 160, minHeight: 38 }}
          />
        </label>
        <input
          className="input"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Catatan (opsional)"
          style={{ flex: 1, minWidth: 180, minHeight: 38 }}
        />
        <button
          className="button"
          onClick={save}
          disabled={!selectedCount || busy}
        >
          {busy ? "Menyimpan..." : `Simpan Closing Surabaya (${selectedCount})`}
        </button>
      </div>
    </div>
  );
}