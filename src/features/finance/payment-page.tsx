"use client";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api-client/client";
import { FormFieldsSkeleton } from "@/components/ui/skeleton";
import { formatIdr } from "@/lib/formatters";
type Invoice = {
  id: string;
  code: string;
  balance_idr: string;
  status: string;
};

export function PaymentPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const load = () =>
    api
      .get<Invoice[]>("/api/v1/invoices?pageSize=100&status=UNPAID")
      .then(setInvoices)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api.post(
        "/api/v1/payments",
        {
          invoiceId: form.get("invoiceId"),
          amountIdr: form.get("amountIdr"),
          method: form.get("method"),
          paidAt: new Date().toISOString(),
          reference: form.get("reference") || null,
        },
        { "Idempotency-Key": crypto.randomUUID() },
      );
      setMessage("Pembayaran berhasil dicatat.");
      event.currentTarget.reset();
      load();
    } catch (value) {
      setMessage(value instanceof Error ? value.message : "Gagal menyimpan.");
    }
  }
  if (loading) {
    return (
      <>
        <h1>Pembayaran</h1>
        <FormFieldsSkeleton fields={4} />
      </>
    );
  }

  return (
    <>
      <h1>Pembayaran</h1>
      <form
        className="card"
        onSubmit={submit}
        style={{
          padding: 20,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
          gap: 14,
        }}
      >
        <label>
          <span className="label">Invoice</span>
          <select className="input" name="invoiceId" required>
            <option value="">Pilih invoice</option>
            {invoices.map((i) => (
              <option key={i.id} value={i.id}>
                {i.code} — sisa {formatIdr(i.balance_idr)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Nominal</span>
          <input
            className="input"
            name="amountIdr"
            type="number"
            min="1"
            required
          />
        </label>
        <label>
          <span className="label">Metode</span>
          <select className="input" name="method">
            <option>CASH</option>
            <option>BANK_TRANSFER</option>
            <option>OTHER</option>
          </select>
        </label>
        <label>
          <span className="label">Referensi</span>
          <input className="input" name="reference" />
        </label>
        <div style={{ alignSelf: "end" }}>
          <button className="button">Catat Pembayaran</button>
        </div>
      </form>
      {message && <p>{message}</p>}
    </>
  );
}
