"use client";

import { FormEvent, useRef, useState } from "react";
import { CustomerCombobox } from "@/components/ui/customer-combobox";
import { CourierCombobox } from "@/components/ui/courier-combobox";
import {
  ImageUploader,
  type ImageUploaderHandle,
} from "@/components/ui/image-uploader";
import { PageHeader } from "@/components/ui/page-header";
import { Snackbar, SnackbarType } from "@/components/ui/snackbar";
import { api } from "@/lib/api-client/client";
import { ApiClientError } from "@/lib/api-client/errors";

export default function IncomingPage() {
  const tracking = useRef<HTMLInputElement>(null);
  const imageUploaderRef = useRef<ImageUploaderHandle>(null);
  const [formResetSignal, setFormResetSignal] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    type: SnackbarType;
  } | null>(null);
  const [duplicate, setDuplicate] = useState(false);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSnackbar(null);
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
        setSnackbar({
          message: "Minimal satu foto bukti wajib diunggah.",
          type: SnackbarType.Warning,
        });
        return;
      }
      const requestForm = new FormData();
      requestForm.set("payload", JSON.stringify(payload));
      for (const file of files) requestForm.append("file", file);
      const result = await api.post<{ id: string; package_code: string }>(
        "/api/v1/packages",
        requestForm,
      );

      setSnackbar({
        message: `${result.package_code} berhasil dicatat.`,
        type: SnackbarType.Success,
      });
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
        setSnackbar({
          message: "Resi sudah ada. Isi alasan lalu simpan ulang untuk override.",
          type: SnackbarType.Warning,
        });
      } else {
        setSnackbar({
          message:
            value instanceof ApiClientError ? value.message : "Gagal menyimpan.",
          type: SnackbarType.Failed,
        });
      }
    }
  }

  return (
    <>
      <PageHeader
        title="Barang Masuk"
        description="Dashboard untuk mencatat paket yang diterima."
      />

      <form className="card" onSubmit={submit} style={{ padding: 20 }}>
        <div className="form-grid" style={{ display: "grid", gap: 16 }}>
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
          <CustomerCombobox key={`customer-${formResetSignal}`} required />
          <CourierCombobox key={`courier-${formResetSignal}`} />
          <label>
            <span className="label">Status *</span>
            <select className="input" name="receivingCondition" required>
              <option value="RECEIVED">Diterima</option>
              <option value="DAMAGED">Diterima Rusak</option>
            </select>
          </label>
          <label>
            <span className="label">Tanggal terima *</span>
            <input
              className="input"
              name="receivedDate"
              type="date"
              defaultValue={today}
              required
            />
          </label>
          <label>
            <span className="label">Waktu terima</span>
            <input className="input" name="receivedTime" type="time" />
          </label>
          <label>
            <span className="label">Berat aktual (kg) *</span>
            <input
              className="input"
              name="actualWeightKg"
              type="number"
              min="0.001"
              step="0.001"
              required
            />
          </label>
          <label>
            <span className="label">Harga *</span>
            <input
              className="input"
              name="harga"
              type="number"
              min="1"
              placeholder="Nominal harga"
              required
            />
          </label>
          <label>
            <span className="label">Panjang (cm)</span>
            <input
              className="input"
              name="lengthCm"
              type="number"
              min="0.01"
              step="0.01"
            />
          </label>
          <label>
            <span className="label">Lebar (cm)</span>
            <input
              className="input"
              name="widthCm"
              type="number"
              min="0.01"
              step="0.01"
            />
          </label>
          <label>
            <span className="label">Tinggi (cm)</span>
            <input
              className="input"
              name="heightCm"
              type="number"
              min="0.01"
              step="0.01"
            />
          </label>
        </div>
        <label style={{ display: "block", marginTop: 16 }}>
          <span className="label">Catatan</span>
          <textarea
            className="input"
            name="catatan"
            placeholder="Catatan tambahan"
            rows={3}
          />
        </label>

        {duplicate && (
          <label style={{ display: "block", marginTop: 16 }}>
            <span className="label">Alasan menyimpan resi duplikat *</span>
            <input
              className="input"
              name="duplicateOverrideReason"
              required
              autoFocus
            />
          </label>
        )}

        <div style={{ marginTop: 18 }}>
          <span className="label">Bukti foto * (total 1–2)</span>
          <ImageUploader ref={imageUploaderRef} maxFiles={2} />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button className="button">Simpan &amp; Paket Berikutnya</button>
        </div>
      </form>

      {snackbar && (
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          onClose={() => setSnackbar(null)}
        />
      )}
    </>
  );
}
