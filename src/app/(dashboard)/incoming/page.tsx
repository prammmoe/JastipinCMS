"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { PackagePlus } from "lucide-react";
import { CustomerCombobox } from "@/components/ui/customer-combobox";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/lib/api-client/client";
import { ApiClientError } from "@/lib/api-client/errors";

type Option = {
  id: string;
  name: string;
  code?: string;
  rate_per_kg_idr?: string;
};

export default function IncomingPage() {
  const tracking = useRef<HTMLInputElement>(null);
  const [rates, setRates] = useState<Option[]>([]);
  const [customerResetSignal, setCustomerResetSignal] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState(false);

  useEffect(() => {
    api
      .get<Option[]>("/api/v1/rate-configs?pageSize=100")
      .then(setRates);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      trackingNumber: data.get("trackingNumber"),
      customerId: data.get("customerId") || null,
      customerName: data.get("customerName") || null,
      courier: data.get("courier") || null,
      actualWeightKg: data.get("actualWeightKg") || null,
      lengthCm: data.get("lengthCm") || null,
      widthCm: data.get("widthCm") || null,
      heightCm: data.get("heightCm") || null,
      chargeType: data.get("chargeType"),
      rateConfigId: data.get("rateConfigId") || null,
      manualAmountIdr: data.get("manualAmountIdr") || null,
      duplicateOverride: duplicate,
      duplicateOverrideReason: data.get("duplicateOverrideReason") || null,
      overrideReason: data.get("overrideReason") || null,
      notes: data.get("notes") || null,
    };

    try {
      const result = await api.post<{ package_code: string }>(
        "/api/v1/packages",
        payload,
      );
      setMessage(`${result.package_code} berhasil dicatat.`);
      form.reset();
      setCustomerResetSignal((current) => current + 1);
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
          style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}
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
          <label>
            <span className="label">Kurir</span>
            <input className="input" name="courier" placeholder="SPX, JNE, J&T" />
          </label>
          <CustomerCombobox key={customerResetSignal} />
        </div>

        <div style={{ height: 1, background: "var(--border)" }} />

        <div
          className="grid-responsive"
          style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}
        >
          <label>
            <span className="label">Berat aktual (kg)</span>
            <input className="input" name="actualWeightKg" type="number" step="0.001" min="0" />
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
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}
        >
          <label>
            <span className="label">Jenis harga</span>
            <select className="input" name="chargeType">
              <option>WEIGHT</option>
              <option>VOLUMETRIC</option>
              <option>FIXED</option>
              <option>MANUAL</option>
            </select>
          </label>
          <label>
            <span className="label">Tarif</span>
            <select className="input" name="rateConfigId">
              <option value="">Pilih bila berbasis berat</option>
              {rates.map((rate) => (
                <option key={rate.id} value={rate.id}>
                  {rate.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Nominal fixed/manual</span>
            <input className="input" name="manualAmountIdr" type="number" min="0" />
          </label>
        </div>

        <div
          className="grid-responsive"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <label>
            <span className="label">Alasan harga manual</span>
            <input className="input" name="overrideReason" />
          </label>
          <label>
            <span className="label">Catatan</span>
            <input className="input" name="notes" />
          </label>
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
