"use client";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api-client/client";
import { useSnackbar } from "@/components/ui/snackbar";

export function PasswordSection() {
  const snackbar = useSnackbar();
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const currentPassword = String(form.currentPassword.value);
    const newPassword = String(form.newPassword.value);
    const confirmPassword = String(form.confirmPassword.value);
    if (newPassword !== confirmPassword) {
      snackbar.error("Konfirmasi password baru tidak cocok.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/api/v1/account/change-password", {
        currentPassword,
        newPassword,
      });
      form.reset();
      snackbar.success("Password berhasil diubah.");
    } catch (value) {
      snackbar.error(
        value instanceof Error ? value.message : "Gagal mengubah password.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card" style={{ padding: 20, marginTop: 18 }}>
      <h3>Ganti Password</h3>
      <p className="muted" style={{ fontSize: 12, marginBottom: 14 }}>
        Ubah password untuk akun yang sedang login. Minimal 10 karakter.
      </p>
      <form
        onSubmit={submit}
        style={{ display: "grid", gap: 14, maxWidth: 420 }}
      >
        <label>
          <span className="label">Password saat ini *</span>
          <input
            className="input"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
        <label>
          <span className="label">Password baru *</span>
          <input
            className="input"
            name="newPassword"
            type="password"
            required
            minLength={10}
            maxLength={128}
            autoComplete="new-password"
          />
        </label>
        <label>
          <span className="label">Konfirmasi password baru *</span>
          <input
            className="input"
            name="confirmPassword"
            type="password"
            required
            minLength={10}
            maxLength={128}
            autoComplete="new-password"
          />
        </label>
        <div>
          <button className="button" disabled={busy}>
            {busy ? "Menyimpan..." : "Simpan Password"}
          </button>
        </div>
      </form>
    </section>
  );
}