"use client";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api-client/client";
import { FormFieldsSkeleton } from "@/components/ui/skeleton";
import { useSnackbar } from "@/components/ui/snackbar";

type Customer = { id: string; code: string; name: string };
type Pkg = {
  id: string;
  package_code: string;
  tracking_number: string;
  customer_id: string;
};

export function PickupPage() {
  const snackbar = useSnackbar();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [customer, setCustomer] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Customer[]>("/api/v1/customers?pageSize=100"),
      api.get<Pkg[]>("/api/v1/packages?pageSize=100&status=READY_FOR_PICKUP"),
    ])
      .then(([c, p]) => {
        setCustomers(c);
        setPackages(p);
      })
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api.post(
        "/api/v1/pickups",
        {
          customerId: customer,
          packageIds: form.getAll("packageIds"),
          pickedUpAt: new Date().toISOString(),
          recipientName: form.get("recipientName") || null,
          notes: form.get("notes") || null,
        },
        { "Idempotency-Key": crypto.randomUUID() },
      );
      snackbar.success("Pengambilan berhasil diselesaikan.");
      location.reload();
    } catch (value) {
      snackbar.error(
        value instanceof Error ? value.message : "Gagal menyimpan.",
      );
    }
  }

  const available = packages.filter((p) => p.customer_id === customer);

  if (loading) {
    return (
      <>
        <h1>Pengambilan Paket</h1>
        <FormFieldsSkeleton fields={4} />
      </>
    );
  }

  return (
    <>
      <h1>Pengambilan Paket</h1>
      <form
        className="card"
        onSubmit={submit}
        style={{ padding: 20, display: "grid", gap: 16 }}
      >
        <label>
          <span className="label">Customer</span>
          <select
            className="input"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            required
          >
            <option value="">Pilih customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="label">Paket siap diambil</span>
          {available.map((p) => (
            <label
              key={p.id}
              style={{
                display: "flex",
                gap: 10,
                padding: 10,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <input type="checkbox" name="packageIds" value={p.id} />
              {p.package_code} — {p.tracking_number}
            </label>
          ))}
          {customer && available.length === 0 && (
            <p className="muted">Tidak ada paket siap diambil.</p>
          )}
        </div>
        <label>
          <span className="label">Nama penerima</span>
          <input className="input" name="recipientName" />
        </label>
        <label>
          <span className="label">Catatan</span>
          <input className="input" name="notes" />
        </label>
        <div>
          <button className="button">Selesaikan Pengambilan</button>
        </div>
      </form>
    </>
  );
}
