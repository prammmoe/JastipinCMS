"use client";

import { FormEvent, useRef, useState } from "react";
import { PackagePlus } from "lucide-react";
import { CustomerCombobox } from "@/components/ui/customer-combobox";
import { CourierCombobox } from "@/components/ui/courier-combobox";
import { ImageUploader, type ImageUploaderHandle } from "@/components/ui/image-uploader";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/lib/api-client/client";
import { ApiClientError } from "@/lib/api-client/errors";

export default function IncomingPage() {
  const tracking = useRef<HTMLInputElement>(null);
  const imageUploaderRef = useRef<ImageUploaderHandle>(null);
  const [formResetSignal, setFormResetSignal] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState(false);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);

    const harga = data.get("harga");
    const receivingCondition =
      data.get("receivingCondition") === "DAMAGED" ? "DAMAGED" : "RECEIVED";
    const payload = {
      trackingNumber: data.get("trackingNumber"),
      customerId: data.get("customerId") || null,
      customerName: data.get("customerName") || null,
      courier: data.get("courier") || null,
      actualWeightKg: data.get("actualWeightKg") || null,
      lengthCm: data.get("lengthCm") || null,
      widthCm: data.get("widthCm") || null,
      heightCm: data.get("heightCm") || null,
      chargeType: "FIXED" as const,
      manualAmountIdr: harga ? Number(harga) : null,
      receivedDate: data.get("receivedDate"),
      receivedTime: data.get("receivedTime") || null,
      receivingCondition,
      notes: data.get("catatan") || null,
      duplicateOverride: duplicate,
      duplicateOverrideReason: data.get("duplicateOverrideReason") || null,
    };

    try {
      const files = imageUploaderRef.current?.getFiles() ?? [];
      if (files.length === 0) {
        setError("Minimal satu foto bukti wajib diunggah.");
        return;
      }
      const requestForm = new FormData();
      requestForm.set("payload", JSON.stringify(payload));
      for (const file of files) requestForm.append("file", file);
      const result = await api.post<{ id: string; package_code: string }>(
        "/api/v1/packages",
        requestForm,
      );

      setMessage(`${result.package_code} berhasil dicatat.`);
      form.reset();
      imageUploaderRef.current?.clear();
      setFormResetSignal((current) => current + 1);
      setDuplicate(false);
      tracking.current?.focus();
    } catch (value) {
      if (
        value instanceof ApiClientError &&
        value.code === "PACKAGE_DUPLICATE_TRACKING"
      ) {
        setDuplicate(true);
        setError(
          "Resi sudah ada. Isi alasan lalu simpan ulang untuk override.",
        );
      } else {
        setError(
          value instanceof ApiClientError ? value.message : "Gagal menyimpan.",
        );
      }
    }
  }

  return (
    <>
      <PageHeader
        title="Barang Masuk"
        description="Catat paket berikutnya tanpa meninggalkan halaman ini. Input nomor resi tetap fokus untuk penggunaan scanner."
      />

      <form
        className="card"
        onSubmit={submit}
        style={{ padding: 24, display: "grid", gap: 22 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="brand-mark" style={{ width: 32, height: 32 }}>
            <PackagePlus size={16} />
          </span>
          <div>
            <h3 style={{ marginBottom: 2 }}>Informasi paket</h3>
            <span className="muted" style={{ fontSize: 12 }}>
              Nomor resi dan pemilik paket
            </span>
          </div>
        </div>

        <div
          className="grid-responsive"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 16,
          }}
        >
          <label>
            <span className="label">Nomor resi *</span>
            <input
              ref={tracking}
              className="input"
              name="trackingNumber"
              required
              autoFocus
              placeholder="Ketik lalu klik Enter"
            />
          </label>
          <CourierCombobox key={`courier-${formResetSignal}`} />
          <label>
            <span className="label">Status *</span>
            <select className="input" name="receivingCondition" required>
              <option value="RECEIVED">Diterima</option>
              <option value="DAMAGED">Diterima Rusak</option>
            </select>
          </label>
          <CustomerCombobox key={`customer-${formResetSignal}`} required />
        </div>

        <div style={{ height: 1, background: "var(--border)" }} />

        <div
          className="grid-responsive"
          style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}
        >
          <label>
            <span className="label">Berat aktual (kg) *</span>
            <input className="input" name="actualWeightKg" type="number" step="0.001" min="0.001" required />
          </label>
          {["lengthCm", "widthCm", "heightCm"].map((name, index) => (
            <label key={name}>
              <span className="label">
                {["Panjang", "Lebar", "Tinggi"][index]} (cm)
              </span>
              <input className="input" name={name} type="number" step="0.01" min="0" />
            </label>
          ))}
        </div>

        <div
          className="grid-responsive"
          style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}
        >
          <label>
            <span className="label">Harga *</span>
            <input className="input" name="harga" type="number" min="1" placeholder="Nominal harga" required />
          </label>
          <label>
            <span className="label">Tanggal terima *</span>
            <input className="input" name="receivedDate" type="date" defaultValue={today} required />
          </label>
          <label>
            <span className="label">Waktu terima</span>
            <input className="input" name="receivedTime" type="time" />
          </label>
          <label>
            <span className="label">Catatan</span>
            <input className="input" name="catatan" placeholder="Catatan tambahan" />
          </label>
        </div>

        <div style={{ height: 1, background: "var(--border)" }} />

        <div>
          <span className="label">Foto Bukti *</span>
          <ImageUploader ref={imageUploaderRef} maxFiles={2} />
        </div>

        {duplicate && (
          <label>
            <span className="label">Alasan menyimpan resi duplikat *</span>
            <input className="input" name="duplicateOverrideReason" required autoFocus />
          </label>
        )}
        {error && <div className="feedback error">{error}</div>}
        {message && <div className="feedback">{message}</div>}
        <div>
          <button className="button">Simpan &amp; Paket Berikutnya</button>
        </div>
      </form>
    </>
  );
}
