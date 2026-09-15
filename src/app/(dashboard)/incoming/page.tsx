"use client";

import { CustomerCombobox } from "@/components/ui/customer-combobox";
import { CourierCombobox } from "@/components/ui/courier-combobox";
import {
  ImageUploader,
  type ImageUploaderHandle,
} from "@/components/ui/image-uploader";
import { useRef, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/lib/api-client/client";
import { ApiClientError } from "@/lib/api-client/errors";
import { useSnackbar } from "@/components/ui/snackbar";
import { normalizePhoneNumber } from "@/server/domain/customers/normalize-phone-number";

export default function IncomingPage() {
  const snackbar = useSnackbar();
  const tracking = useRef<HTMLInputElement>(null);
  const imageUploaderRef = useRef<ImageUploaderHandle>(null);
  const [formResetSignal, setFormResetSignal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const form = event.currentTarget;
    const data = new FormData(form);

    const rawPhone = data.get("customerPhone")
      ? String(data.get("customerPhone")).trim()
      : "";
    if (rawPhone && !normalizePhoneNumber(rawPhone)) {
      snackbar.error("Nomor telepon harus diawali dengan 08 atau +62.");
      setIsSubmitting(false);
      return;
    }

    const harga = data.get("harga");
    const receivingCondition =
      data.get("receivingCondition") === "DAMAGED" ? "DAMAGED" : "RECEIVED";
    const payload = {
      trackingNumber: data.get("trackingNumber"),
      customerId: data.get("customerId") || null,
      customerName: data.get("customerName") || null,
      customerPhone: rawPhone || null,
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
    };

    try {
      const files = imageUploaderRef.current?.getFiles() ?? [];
      if (files.length === 0) {
        snackbar.error("Minimal satu foto bukti wajib diunggah.");
        setIsSubmitting(false);
        return;
      }
      const requestForm = new FormData();
      requestForm.set("payload", JSON.stringify(payload));
      for (const file of files) requestForm.append("file", file);
      const result = await api.post<{ id: string; package_code: string }>(
        "/api/v1/packages",
        requestForm,
      );

      snackbar.success(`${result.package_code} berhasil dicatat.`);
      form.reset();
      imageUploaderRef.current?.clear();
      setFormResetSignal((current) => current + 1);
      tracking.current?.focus();
    } catch (value) {
      snackbar.error(
        value instanceof ApiClientError ? value.message : "Gagal menyimpan.",
      );
    } finally {
      setIsSubmitting(false);
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
          <label>
            <span className="label">Nomor telepon customer</span>
            <input
              className="input"
              name="customerPhone"
              type="tel"
              placeholder="Contoh: 081234567890 atau +6281234567890"
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
        </div>

        <div style={{ marginTop: 16 }}>
          <details
            open={isExpanded}
            onToggle={(e) =>
              setIsExpanded((e.target as HTMLDetailsElement).open)
            }
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              background: "var(--surface-subtle)",
              overflow: "hidden",
            }}
          >
            <summary
              style={{
                padding: "12px 16px",
                fontWeight: 600,
                fontSize: 13,
                color: "var(--neutral-800)",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              Detail Paket (Dimensi &amp; Catatan Opsional)
            </summary>
            <div
              style={{
                padding: "16px",
                borderTop: "1px solid var(--border)",
                background: "var(--surface)",
                display: "grid",
                gap: 16,
              }}
            >
              <div>
                <span
                  className="label"
                  style={{ marginBottom: 8, color: "var(--neutral-600)" }}
                >
                  Dimensi Paket (P × L × T dalam cm)
                </span>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                    gap: 12,
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <span className="label" style={{ fontWeight: 500 }}>
                      Panjang (cm)
                    </span>
                    <input
                      className="input"
                      name="lengthCm"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0"
                    />
                  </label>

                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <span className="label" style={{ fontWeight: 500 }}>
                      Lebar (cm)
                    </span>
                    <input
                      className="input"
                      name="widthCm"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0"
                    />
                  </label>

                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <span className="label" style={{ fontWeight: 500 }}>
                      Tinggi (cm)
                    </span>
                    <input
                      className="input"
                      name="heightCm"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0"
                    />
                  </label>
                </div>
              </div>

              <label
                style={{ display: "flex", flexDirection: "column", gap: 6 }}
              >
                <span className="label">Catatan</span>
                <textarea
                  className="input"
                  name="catatan"
                  placeholder="Catatan tambahan paket (opsional)"
                  rows={3}
                  style={{ resize: "vertical", minHeight: 70 }}
                />
              </label>
            </div>
          </details>
        </div>
        <div style={{ marginTop: 18 }}>
          <span className="label">Bukti foto * (total 1–2)</span>
          <ImageUploader ref={imageUploaderRef} maxFiles={2} />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button className="button" disabled={isSubmitting}>
            {isSubmitting ? "Memproses..." : "Simpan & Paket Berikutnya"}
          </button>
        </div>
      </form>
    </>
  );
}