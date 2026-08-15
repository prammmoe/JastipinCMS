"use client";
/* eslint-disable react-hooks/exhaustive-deps */
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api-client/client";

export function EntityDetail({ section, id }: { section: string; id: string }) {
  const endpoint = section === "packages" ? "packages" : section;
  const [data, setData] = useState<Record<string, unknown>>();
  const [message, setMessage] = useState("");
  const load = () =>
    api.get<Record<string, unknown>>(`/api/v1/${endpoint}/${id}`).then(setData);
  useEffect(() => {
    load();
  }, [id]);
  async function action(name: string, body: unknown = {}) {
    try {
      await api.post(`/api/v1/${endpoint}/${id}/${name}`, body);
      setMessage("Tindakan berhasil.");
      load();
    } catch (value) {
      setMessage(value instanceof Error ? value.message : "Tindakan gagal.");
    }
  }
  async function scan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await action("arrival-scan", {
      trackingNumber: form.get("trackingNumber"),
      condition: form.get("condition"),
    });
    event.currentTarget.reset();
  }
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1>Detail {section}</h1>
          <p className="muted">ID: {id}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {section === "closings" && (
            <>
              <button className="button" onClick={() => action("finalize")}>
                Finalisasi
              </button>
              <a
                className="button secondary"
                href={`/api/v1/closings/${id}/export?format=xlsx`}
              >
                XLSX
              </a>
              <a
                className="button secondary"
                href={`/api/v1/closings/${id}/export?format=pdf`}
              >
                PDF
              </a>
            </>
          )}
          {section === "shipments" && (
            <>
              <button className="button" onClick={() => action("depart")}>
                Berangkatkan
              </button>
              <button
                className="button secondary"
                onClick={() => action("reconcile", { confirmMissing: true })}
              >
                Rekonsiliasi
              </button>
            </>
          )}
        </div>
      </div>
      {section === "shipments" && (
        <form
          className="card"
          onSubmit={scan}
          style={{ padding: 18, display: "flex", gap: 12, marginBottom: 18 }}
        >
          <input
            className="input"
            name="trackingNumber"
            placeholder="Input nomor resi"
            autoFocus
            required
          />
          <select className="input" name="condition" style={{ maxWidth: 180 }}>
            <option>OK</option>
            <option>DAMAGED</option>
          </select>
          <button className="button">Scan</button>
        </form>
      )}
      {message && (
        <div className="card" style={{ padding: 14, marginBottom: 14 }}>
          {message}
        </div>
      )}
      <div className="card" style={{ padding: 20, overflowX: "auto" }}>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>
          {data ? JSON.stringify(data, null, 2) : "Memuat..."}
        </pre>
      </div>
    </>
  );
}
