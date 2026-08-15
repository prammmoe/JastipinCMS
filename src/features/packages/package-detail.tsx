"use client";
/* eslint-disable react-hooks/exhaustive-deps */
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api-client/client";
import { formatDateTime, formatIdr } from "@/lib/formatters";
type Customer = { id: string; code: string; name: string };
type Pkg = {
  id: string;
  package_code: string;
  tracking_number: string;
  status: string;
  shipping_fee_idr: string;
  received_at: string;
  customer_id?: string;
  notes?: string;
  package_status_history: {
    id: string;
    to_status: string;
    created_at: string;
    reason?: string;
  }[];
  package_attachments: { id: string; original_filename: string }[];
};
export function PackageDetail({ id }: { id: string }) {
  const [pkg, setPkg] = useState<Pkg>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState("");
  const [message, setMessage] = useState("");
  const load = () =>
    Promise.all([
      api.get<Pkg>(`/api/v1/packages/${id}`),
      api.get<Customer[]>("/api/v1/customers?pageSize=100"),
    ]).then(([p, c]) => {
      setPkg(p);
      setCustomers(c);
      setCustomer(p.customer_id ?? "");
    });
  useEffect(() => {
    load();
  }, [id]);
  async function assign() {
    await api.post(`/api/v1/packages/${id}/assign-customer`, {
      customerId: customer,
    });
    setMessage("Customer berhasil ditetapkan.");
    load();
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("packageId", id);
    await api.post(`/api/v1/uploads/packages`, form);
    setMessage("Foto berhasil diunggah.");
    load();
  }
  if (!pkg) return <p>Memuat...</p>;
  return (
    <>
      <h1>{pkg.package_code}</h1>
      <p className="muted">
        {pkg.tracking_number} · {formatDateTime(pkg.received_at)}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 16,
        }}
      >
        <div className="card" style={{ padding: 20 }}>
          <h3>Data Paket</h3>
          <p>
            Status: <span className="badge">{pkg.status}</span>
          </p>
          <p>
            Biaya: <strong>{formatIdr(pkg.shipping_fee_idr)}</strong>
          </p>
          <p>{pkg.notes}</p>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h3>Customer</h3>
          <select
            className="input"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          >
            <option value="">Belum diketahui</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
          <button
            className="button"
            onClick={assign}
            disabled={!customer}
            style={{ marginTop: 10 }}
          >
            Tetapkan Customer
          </button>
        </div>
        <form className="card" onSubmit={upload} style={{ padding: 20 }}>
          <h3>Bukti Foto</h3>
          <input
            className="input"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
          />
          <select className="input" name="type" style={{ marginTop: 10 }}>
            <option>RECEIVED</option>
            <option>ARRIVAL</option>
            <option>DAMAGED</option>
            <option>OTHER</option>
          </select>
          <button className="button" style={{ marginTop: 10 }}>
            Unggah
          </button>
          {pkg.package_attachments.map((file) => (
            <a
              key={file.id}
              href={`/api/v1/files/${file.id}`}
              target="_blank"
              style={{ display: "block", marginTop: 8 }}
            >
              {file.original_filename}
            </a>
          ))}
        </form>
      </div>
      <div className="card" style={{ padding: 20, marginTop: 18 }}>
        <h3>Riwayat Status</h3>
        {pkg.package_status_history.map((item) => (
          <div
            key={item.id}
            style={{
              padding: "10px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <strong>{item.to_status}</strong>
            <span className="muted">
              {" "}
              · {formatDateTime(item.created_at)}{" "}
              {item.reason && `· ${item.reason}`}
            </span>
          </div>
        ))}
      </div>
      {message && <p>{message}</p>}
    </>
  );
}
