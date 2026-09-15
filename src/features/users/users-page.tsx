"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useSnackbar } from "@/components/ui/snackbar";
import { api } from "@/lib/api-client/client";
import { formatDate } from "@/lib/formatters";
import type { Actor, InternalRole } from "@/types/domain";

const ROLES: InternalRole[] = ["ADMIN", "STAFF_SIDOARJO", "STAFF_MERAUKE"];

type UserRow = {
  id: string;
  name: string;
  role: InternalRole;
  is_active: boolean;
  created_at: string;
};

export function UsersPage() {
  const snackbar = useSnackbar();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Actor | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<InternalRole>("STAFF_SIDOARJO");
  const [editActive, setEditActive] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<UserRow[]>("/api/v1/users")
      .then(setRows)
      .catch((value) =>
        snackbar.error(
          value instanceof Error ? value.message : "Gagal memuat data.",
        ),
      )
      .finally(() => setLoading(false));
  }, [snackbar]);

  useEffect(() => {
    const timer = window.setTimeout(load, 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    api
      .get<Actor>("/api/v1/auth/me")
      .then(setMe)
      .catch(() => {});
  }, []);

  const startEdit = (row: UserRow) => {
    setEditingId(row.id);
    setEditName(row.name);
    setEditRole(row.role);
    setEditActive(row.is_active);
  };

  async function saveEdit(row: UserRow) {
    try {
      const updated = await api.patch<UserRow>(`/api/v1/users/${row.id}`, {
        name: editName,
        role: editRole,
        isActive: editActive,
      });
      snackbar.success("User diperbarui.");
      setEditingId(null);
      setRows((current) =>
        current.map((item) => (item.id === row.id ? updated : item)),
      );
    } catch (value) {
      snackbar.error(
        value instanceof Error ? value.message : "Gagal memperbarui user.",
      );
    }
  }

  async function removeUser(row: UserRow) {
    if (!window.confirm(`Hapus user "${row.name}"?`)) return;
    try {
      await api.delete(`/api/v1/users/${row.id}`);
      snackbar.success("User dihapus.");
      setRows((current) => current.filter((item) => item.id !== row.id));
    } catch (value) {
      snackbar.error(
        value instanceof Error ? value.message : "Gagal menghapus user.",
      );
    }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const created = await api.post<UserRow>("/api/v1/users", data);
      event.currentTarget.reset();
      setShowCreate(false);
      snackbar.success("User berhasil dibuat.");
      setRows((current) => [...current, created]);
    } catch (value) {
      snackbar.error(
        value instanceof Error ? value.message : "Gagal menyimpan user.",
      );
    }
  }

  const isSelf = (row: UserRow) => me?.id === row.id;

  return (
    <>
      <PageHeader
        title="Users"
        description="Pengguna internal dan perannya."
        actions={
          <button className="button" onClick={() => setShowCreate(!showCreate)}>
            Tambah User
          </button>
        }
      />
      {showCreate && (
        <form
          className="card"
          onSubmit={createUser}
          style={{
            padding: 20,
            marginBottom: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: 15,
          }}
        >
          <label>
            <span className="label">Nama *</span>
            <input className="input" name="name" required />
          </label>
          <label>
            <span className="label">Email *</span>
            <input className="input" name="email" type="email" required />
          </label>
          <label>
            <span className="label">Password awal *</span>
            <input
              className="input"
              name="password"
              type="password"
              required
              minLength={10}
              maxLength={128}
            />
            <span className="muted" style={{ fontSize: 11 }}>
              Minimal 10 karakter, maksimal 128.
            </span>
          </label>
          <label>
            <span className="label">Role *</span>
            <select className="input" name="role" required defaultValue="STAFF_SIDOARJO">
              {ROLES.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>
          <div style={{ alignSelf: "end" }}>
            <button className="button">Simpan</button>
          </div>
        </form>
      )}
      <div className="card" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <strong style={{ fontSize: 14, fontWeight: 600 }}>
            Users ({rows.length})
          </strong>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Role</th>
                <th>Aktif</th>
                <th>Dibuat</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton columns={4} hasActionColumn />
              ) : (
                <>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      {editingId === row.id ? (
                        <>
                          <td>
                            <input
                              className="input"
                              value={editName}
                              onChange={(event) => setEditName(event.target.value)}
                            />
                          </td>
                          <td>
                            <select
                              className="input"
                              value={editRole}
                              onChange={(event) =>
                                setEditRole(event.target.value as InternalRole)
                              }
                            >
                              {ROLES.map((role) => (
                                <option key={role}>{role}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              className="input"
                              value={editActive ? "1" : "0"}
                              onChange={(event) =>
                                setEditActive(event.target.value === "1")
                              }
                            >
                              <option value="1">Aktif</option>
                              <option value="0">Nonaktif</option>
                            </select>
                          </td>
                          <td className="muted">{formatDate(row.created_at)}</td>
                          <td>
                            <button
                              className="button"
                              style={{ padding: "6px 10px" }}
                              onClick={() => saveEdit(row)}
                            >
                              Simpan
                            </button>
                            <button
                              className="button secondary"
                              style={{ padding: "6px 10px", marginLeft: 6 }}
                              onClick={() => setEditingId(null)}
                            >
                              Batal
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            {row.name}
                            {isSelf(row) && (
                              <span className="muted" style={{ fontSize: 11 }}>
                                {" "}
                                (Anda)
                              </span>
                            )}
                          </td>
                          <td>{row.role}</td>
                          <td>
                            <span
                              className={
                                row.is_active
                                  ? "status-text success"
                                  : "status-text danger"
                              }
                            >
                              {row.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td className="muted">{formatDate(row.created_at)}</td>
                          <td>
                            <button
                              className="button secondary"
                              style={{ padding: "6px 10px" }}
                              onClick={() => startEdit(row)}
                            >
                              Edit
                            </button>
                            <button
                              className="button secondary"
                              style={{ padding: "6px 10px", marginLeft: 6 }}
                              disabled={isSelf(row)}
                              onClick={() => removeUser(row)}
                            >
                              Hapus
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td
                        colSpan={5}
                        className="muted"
                        style={{ textAlign: "center", padding: 30 }}
                      >
                        Belum ada user.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}