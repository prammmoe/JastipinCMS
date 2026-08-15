"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  Boxes,
  ChartNoAxesCombined,
  CircleHelp,
  CreditCard,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  PackagePlus,
  ReceiptText,
  ScanLine,
  Settings,
  Ship,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { api } from "@/lib/api-client/client";
import type { Actor } from "@/types/domain";

const groups = [
  { label: "", items: [["/dashboard", "Dashboard", LayoutDashboard]] },
  {
    label: "OPERASIONAL",
    items: [
      ["/incoming", "Barang Masuk", PackagePlus],
      ["/packages", "Semua Barang", Boxes],
      ["/unidentified", "Belum Diketahui", CircleHelp],
      ["/closings", "Closing", Archive],
      ["/shipments", "Pengiriman", Ship],
      ["/arrivals", "Kedatangan", ScanLine],
      ["/pickups", "Pengambilan", HandCoins],
    ],
  },
  { label: "DATA", items: [["/customers", "Customer", Users]] },
  {
    label: "KEUANGAN",
    items: [
      ["/invoices", "Tagihan", ReceiptText],
      ["/payments", "Pembayaran", CreditCard],
      ["/expenses", "Pengeluaran", WalletCards],
    ],
  },
  {
    label: "LAPORAN",
    items: [
      ["/reports-operational", "Operasional", ChartNoAxesCombined],
      ["/reports-financial", "Keuangan", ChartNoAxesCombined],
    ],
  },
  {
    label: "SYSTEM",
    items: [
      ["/rates", "Tarif", Settings],
      ["/users", "Users", Users],
      ["/audit-log", "Audit Log", ReceiptText],
      ["/settings", "Settings", Settings],
    ],
  },
] as const;

const restricted: Record<string, string[]> = {
  FINANCE: [
    "/incoming",
    "/unidentified",
    "/closings",
    "/shipments",
    "/arrivals",
    "/pickups",
  ],
  STAFF_SIDOARJO: [
    "/arrivals",
    "/pickups",
    "/payments",
    "/expenses",
    "/rates",
    "/users",
    "/audit-log",
    "/settings",
  ],
  STAFF_MERAUKE: [
    "/incoming",
    "/closings",
    "/payments",
    "/expenses",
    "/rates",
    "/users",
    "/audit-log",
    "/settings",
  ],
};

function initials(name?: string) {
  return (name ?? "J")
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [user, setUser] = useState<Actor | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    api
      .get<Actor>("/api/v1/auth/me")
      .then(setUser)
      .catch(() => {});
  }, []);

  const logout = async () => {
    await api.post("/api/v1/auth/logout");
    location.assign("/login");
  };

  return (
    <div className="app-shell">
      <aside className={`desktop-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">
            <PackageCheck size={19} strokeWidth={1.8} />
          </span>
          <div>
            <div className="brand-name">JASTIPin CMS</div>
          </div>
          {mobileOpen && (
            <button
              className="button ghost mobile-menu-button"
              type="button"
              aria-label="Tutup menu"
              onClick={() => setMobileOpen(false)}
              style={{ marginLeft: "auto", minHeight: 34, padding: 7 }}
            >
              <X size={17} />
            </button>
          )}
        </div>

        <nav className="sidebar-scroll" aria-label="Navigasi utama">
          {groups.map((group) => (
            <div className="nav-group" key={group.label}>
              {group.label && (
                <div className="nav-group-label">{group.label}</div>
              )}
              {group.items
                .filter(
                  ([href]) => !user || !restricted[user.role]?.includes(href),
                )
                .map(([href, label, Icon]) => {
                  const active = path === href || path.startsWith(`${href}/`);
                  return (
                    <Link
                      className={`nav-link ${active ? "active" : ""}`}
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon size={17} />
                      {label}
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="button secondary"
            onClick={logout}
            style={{ width: "100%" }}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          {!mobileOpen && (
            <button
              className="button secondary mobile-menu-button"
              type="button"
              aria-label="Buka menu"
              onClick={() => setMobileOpen(true)}
              style={{ minHeight: 38, padding: 8 }}
            >
              <Menu size={18} />
            </button>
          )}

          <div className="topbar-user">
            <span className="user-avatar" aria-hidden="true">
              {initials(user?.name)}
            </span>
            <div className="user-copy">
              <div className="user-name">{user?.name ?? "Memuat..."}</div>
              <div className="user-role">
                {user?.role?.replaceAll("_", " ") ?? ""}
              </div>
            </div>
          </div>
        </header>

        <div className="content-shell">{children}</div>
      </main>
    </div>
  );
}
