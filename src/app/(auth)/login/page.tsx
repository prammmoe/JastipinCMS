"use client";

import { FormEvent, useState } from "react";
import { PackageCheck } from "lucide-react";
import { api } from "@/lib/api-client/client";
import { ApiClientError } from "@/lib/api-client/errors";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      await api.post("/api/v1/auth/login", {
        email: form.get("email"),
        password: form.get("password"),
      });
      location.assign("/dashboard");
    } catch (value) {
      setError(
        value instanceof ApiClientError ? value.message : "Gagal masuk.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <div className="card login-card">
        <div className="login-brand">
          <span className="brand-mark" aria-hidden="true">
            <PackageCheck size={19} strokeWidth={1.8} />
          </span>
          <div>
            <h1 className="login-title">JASTIPin CMS</h1>
            <p className="login-subtitle">Internal business operations</p>
          </div>
        </div>

        <div style={{ marginBottom: 26 }}>
          <h2 style={{ marginBottom: 7 }}>Selamat datang</h2>
          <p className="muted" style={{ marginBottom: 0, lineHeight: 1.6 }}>
            Masuk menggunakan akun internal yang telah diberikan administrator.
          </p>
        </div>

        <form onSubmit={submit} style={{ display: "grid", gap: 17 }}>
          <label>
            <span className="label">Email</span>
            <input
              className="input"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="nama@jastipin.com"
              required
              autoFocus
            />
          </label>
          <label>
            <span className="label">Password</span>
            <input
              className="input"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Masukkan password"
              required
            />
          </label>
          {error && <div className="feedback error">{error}</div>}
          <button className="button" disabled={busy}>
            {busy ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </main>
  );
}
