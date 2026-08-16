"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Pencil, RotateCcw, X } from "lucide-react";
import { CourierCombobox } from "@/components/ui/courier-combobox";
import { CustomerCombobox } from "@/components/ui/customer-combobox";
import { ImageUploader, ImageUploaderHandle } from "@/components/ui/image-uploader";
import { api } from "@/lib/api-client/client";
import { ApiClientError } from "@/lib/api-client/errors";
import { formatIdr, formatReceivedDate } from "@/lib/formatters";
import { packageStatusLabel } from "@/lib/package-status";

type Customer = { id: string; code: string; name: string };
type Attachment = { id: string; original_filename: string | null; type: string };
type Pkg = {
  id: string;
  package_code: string;
  tracking_number: string;
  courier: string | null;
  status: string;
  shipping_fee_idr: string | number;
  received_date: string;
  received_time: string | null;
  actual_weight_kg: string | number;
  length_cm: string | number | null;
  width_cm: string | number | null;
  height_cm: string | number | null;
  notes: string | null;
  customers: Customer | null;
  package_attachments: Attachment[];
  permissions: { canEdit: boolean };
};

const optionalNumber = (value: FormDataEntryValue | null) =>
  value === null || String(value).trim() === "" ? null : Number(value);

export function PackageDetail({ id }: { id: string }) {
  const [pkg, setPkg] = useState<Pkg>();
  const [editing, setEditing] = useState(false);
  const [keepAttachmentIds, setKeepAttachmentIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const uploader = useRef<ImageUploaderHandle>(null);

  const load = useCallback(async () => {
    const next = await api.get<Pkg>(`/api/v1/packages/${id}`);
    setPkg(next);
    setKeepAttachmentIds(next.package_attachments.map((item) => item.id));
  }, [id]);

  useEffect(() => {
    load().catch((value) =>
      setError(value instanceof Error ? value.message : "Gagal memuat paket."),
    );
  }, [load]);

  function startEdit() {
    if (!pkg) return;
    setKeepAttachmentIds(pkg.package_attachments.map((item) => item.id));
    setMessage("");
    setError("");
    setDuplicate(false);
    setEditing(true);
  }

  function cancelEdit() {
    uploader.current?.clear();
    setEditing(false);
    setError("");
    setDuplicate(false);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pkg) return;
    const values = new FormData(event.currentTarget);
    const files = uploader.current?.getFiles() ?? [];
    if (keepAttachmentIds.length + files.length < 1) {
      setError("Paket wajib menyisakan minimal satu foto.");
      return;
    }
    const payload = {
      trackingNumber: String(values.get("trackingNumber") ?? ""),
      customerId: String(values.get("customerId") ?? "") || null,
      customerName: String(values.get("customerName") ?? ""),
      courier: String(values.get("courier") ?? "") || null,
      receivedDate: String(values.get("receivedDate") ?? ""),
      receivedTime: String(values.get("receivedTime") ?? "") || null,
      actualWeightKg: Number(values.get("actualWeightKg")),
      lengthCm: optionalNumber(values.get("lengthCm")),
      widthCm: optionalNumber(values.get("widthCm")),
      heightCm: optionalNumber(values.get("heightCm")),
      chargeType: "FIXED",
      manualAmountIdr: Number(values.get("manualAmountIdr")),
      receivingCondition: String(values.get("receivingCondition")),
      notes: String(values.get("notes") ?? "") || null,
      duplicateOverride: duplicate,
      duplicateOverrideReason:
        String(values.get("duplicateOverrideReason") ?? "") || null,
      keepAttachmentIds,
    };
    const form = new FormData();
    form.set("payload", JSON.stringify(payload));
    files.forEach((file) => form.append("file", file));
    setSaving(true);
    setError("");
    try {
      await api.patch(`/api/v1/packages/${id}`, form);
      uploader.current?.clear();
      setEditing(false);
      setMessage("Perubahan paket berhasil disimpan.");
      await load();
    } catch (value) {
      if (
        value instanceof ApiClientError &&
        value.code === "PACKAGE_DUPLICATE_TRACKING"
      ) {
        setDuplicate(true);
        setError("Nomor resi sudah ada. Isi alasan lalu simpan ulang untuk override.");
      } else {
        setError(value instanceof Error ? value.message : "Gagal menyimpan paket.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!pkg) return <p>{error || "Memuat..."}</p>;
  const timeValue = pkg.received_time?.slice(0, 5) ?? "";

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1>{pkg.package_code}</h1>
          <p className="muted">{pkg.tracking_number} · {formatReceivedDate(pkg.received_date, pkg.received_time)}</p>
        </div>
        {!editing && pkg.permissions.canEdit && (
          <button className="button" type="button" onClick={startEdit}><Pencil size={16} /> Edit</button>
        )}
      </div>
      {error && <div className="feedback error">{error}</div>}
      {message && <div className="feedback success">{message}</div>}

      {editing ? (
        <form className="card" onSubmit={save} style={{ padding: 20 }}>
          <div className="form-grid">
            <label><span className="label">Nomor resi *</span><input className="input" name="trackingNumber" defaultValue={pkg.tracking_number} required /></label>
            <CustomerCombobox key={`customer-${pkg.customers?.id ?? "legacy"}`} required initialCustomer={pkg.customers} />
            <CourierCombobox key={`courier-${pkg.courier ?? ""}`} initialValue={pkg.courier ?? ""} />
            <label><span className="label">Status *</span><select className="input" name="receivingCondition" defaultValue={pkg.status === "DAMAGED" ? "DAMAGED" : "RECEIVED"} required><option value="RECEIVED">Diterima</option><option value="DAMAGED">Diterima Rusak</option></select></label>
            <label><span className="label">Tanggal terima *</span><input className="input" name="receivedDate" type="date" defaultValue={pkg.received_date} required /></label>
            <label><span className="label">Waktu terima (opsional)</span><input className="input" name="receivedTime" type="time" defaultValue={timeValue} /></label>
            <label><span className="label">Berat aktual (kg) *</span><input className="input" name="actualWeightKg" type="number" min="0.001" step="0.001" defaultValue={pkg.actual_weight_kg} required /></label>
            <label><span className="label">Harga barang *</span><input className="input" name="manualAmountIdr" type="number" min="1" step="1" defaultValue={pkg.shipping_fee_idr} required /></label>
            <label><span className="label">Panjang (cm)</span><input className="input" name="lengthCm" type="number" min="0.01" step="0.01" defaultValue={pkg.length_cm ?? ""} /></label>
            <label><span className="label">Lebar (cm)</span><input className="input" name="widthCm" type="number" min="0.01" step="0.01" defaultValue={pkg.width_cm ?? ""} /></label>
            <label><span className="label">Tinggi (cm)</span><input className="input" name="heightCm" type="number" min="0.01" step="0.01" defaultValue={pkg.height_cm ?? ""} /></label>
          </div>
          <label style={{ display: "block", marginTop: 16 }}><span className="label">Catatan</span><textarea className="input" name="notes" defaultValue={pkg.notes ?? ""} rows={3} /></label>
          {duplicate && (
            <label style={{ display: "block", marginTop: 16 }}>
              <span className="label">Alasan override resi duplikat *</span>
              <input className="input" name="duplicateOverrideReason" required />
            </label>
          )}
          <div style={{ marginTop: 18 }}>
            <span className="label">Bukti foto * (total 1–2)</span>
            <div className="package-photo-grid">
              {pkg.package_attachments.map((attachment) => {
                const kept = keepAttachmentIds.includes(attachment.id);
                return (
                  <div className="package-photo" key={attachment.id} data-removed={!kept}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/v1/files/${attachment.id}`} alt={attachment.original_filename ?? "Foto paket"} />
                    <button type="button" className="image-uploader-remove" onClick={() => setKeepAttachmentIds((current) => kept ? current.filter((item) => item !== attachment.id) : [...current, attachment.id])} aria-label={kept ? "Hapus foto" : "Pulihkan foto"}>
                      {kept ? <X size={14} /> : <RotateCcw size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>
            {keepAttachmentIds.length < 2 && <ImageUploader ref={uploader} maxFiles={2 - keepAttachmentIds.length} />}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button className="button" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
            <button className="button secondary" type="button" onClick={cancelEdit} disabled={saving}>Batal</button>
          </div>
        </form>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3>Data Paket</h3>
            <p>Status: <span className="badge">{packageStatusLabel(pkg.status)}</span></p>
            <p>Harga: <strong>{formatIdr(pkg.shipping_fee_idr)}</strong></p>
            <p>Berat: <strong>{pkg.actual_weight_kg} kg</strong></p>
            <p>Kurir: <strong>{pkg.courier || "—"}</strong></p>
            <p>Dimensi: <strong>{pkg.length_cm && pkg.width_cm && pkg.height_cm ? `${pkg.length_cm} × ${pkg.width_cm} × ${pkg.height_cm} cm` : "—"}</strong></p>
            {pkg.notes && <p className="muted">{pkg.notes}</p>}
          </div>
          <div className="card" style={{ padding: 20 }}><h3>Customer</h3><p><strong>{pkg.customers?.name ?? "Belum ditetapkan"}</strong></p>{pkg.customers?.code && <p className="muted">{pkg.customers.code}</p>}</div>
          <div className="card" style={{ padding: 20 }}>
            <h3>Bukti Foto</h3>
            <div className="package-photo-grid">
              {pkg.package_attachments.map((attachment) => (
                <a className="package-photo" key={attachment.id} href={`/api/v1/files/${attachment.id}`} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/v1/files/${attachment.id}`} alt={attachment.original_filename ?? "Foto paket"} />
                </a>
              ))}
            </div>
            {!pkg.package_attachments.length && <p className="muted">Belum ada foto.</p>}
          </div>
        </div>
      )}
    </>
  );
}
