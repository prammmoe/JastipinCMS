import { notFound } from "next/navigation";
import {
  ResourcePage,
  type ResourceConfig,
} from "@/features/shared/resource-page";
import { PackagesPage } from "@/features/packages/packages-page";
import { ClosingsPage } from "@/features/closings/closings-page";
import { ShippingHistoryPage } from "@/features/shipping-history/shipping-history-page";
import { UsersPage } from "@/features/users/users-page";

const configs: Record<string, ResourceConfig> = {
  packages: {
    title: "Semua Barang",
    description: "Cari dan pantau seluruh paket.",
    endpoint: "/api/v1/packages",
    columns: [
      ["package_code", "Kode"],
      ["tracking_number", "Nomor Resi"],
      ["customers.name", "Customer"],
      ["status", "Status"],
      ["shipping_fee_idr", "Biaya"],
      ["received_date", "Diterima"],
    ],
    detailBase: "/packages",
  },
  customers: {
    title: "Customer",
    description: "Data customer dan riwayat pengiriman.",
    endpoint: "/api/v1/customers",
    columns: [
      ["code", "Kode"],
      ["name", "Nama"],
      ["phone", "Telepon"],
      ["is_active", "Aktif"],
    ],
    fields: [
      { name: "name", label: "Nama", required: true },
      { name: "phone", label: "Telepon" },
      { name: "address", label: "Alamat" },
      { name: "notes", label: "Catatan" },
    ],
    detailBase: "/customers",
  },
  shipments: {
    title: "Pengiriman",
    description: "Pengiriman laut dari Sidoarjo ke Merauke.",
    endpoint: "/api/v1/shipments",
    columns: [
      ["code", "Kode"],
      ["vessel_name", "Kapal"],
      ["status", "Status"],
      ["departure_at", "Berangkat"],
      ["estimated_arrival_at", "Estimasi Tiba"],
    ],
    fields: [
      { name: "vesselName", label: "Nama Kapal" },
      { name: "estimatedArrivalAt", label: "Estimasi Tiba" },
      { name: "notes", label: "Catatan" },
    ],
    detailBase: "/shipments",
  },
  arrivals: {
    title: "Kedatangan",
    description: "Pilih shipment untuk scan dan rekonsiliasi.",
    endpoint: "/api/v1/shipments",
    columns: [
      ["code", "Shipment"],
      ["vessel_name", "Kapal"],
      ["status", "Status"],
      ["departure_at", "Berangkat"],
    ],
    detailBase: "/shipments",
  },
  pickups: {
    title: "Pengambilan",
    description: "Riwayat paket yang diserahkan kepada customer.",
    endpoint: "/api/v1/pickups",
    columns: [
      ["picked_up_at", "Waktu"],
      ["customer_id", "Customer"],
      ["recipient_name", "Penerima"],
    ],
    detailBase: "/pickups",
  },
  invoices: {
    title: "Tagihan",
    description: "Tagihan per customer dan closing.",
    endpoint: "/api/v1/invoices",
    columns: [
      ["code", "Kode"],
      ["status", "Status"],
      ["total_idr", "Total"],
      ["paid_idr", "Dibayar"],
      ["balance_idr", "Sisa"],
    ],
    detailBase: "/invoices",
  },
  payments: {
    title: "Pembayaran",
    description: "Riwayat pembayaran customer.",
    endpoint: "/api/v1/payments",
    columns: [
      ["paid_at", "Tanggal"],
      ["invoice_id", "Invoice"],
      ["amount_idr", "Nominal"],
      ["method", "Metode"],
      ["reference", "Referensi"],
    ],
  },
  expenses: {
    title: "Pengeluaran",
    description: "Biaya operasional bisnis.",
    endpoint: "/api/v1/expenses",
    columns: [
      ["expense_date", "Tanggal"],
      ["category", "Kategori"],
      ["description", "Deskripsi"],
      ["amount_idr", "Nominal"],
    ],
    fields: [
      { name: "expenseDate", label: "Tanggal", type: "date", required: true },
      {
        name: "category",
        label: "Kategori",
        type: "select",
        options: [
          "SEA_FREIGHT",
          "TRANSPORT",
          "PACKAGING",
          "SALARY",
          "RENT",
          "OPERATIONS",
          "OTHER",
        ],
        required: true,
      },
      { name: "amountIdr", label: "Nominal", type: "number", required: true },
      { name: "description", label: "Deskripsi", required: true },
    ],
  },
  "audit-log": {
    title: "Audit Log",
    description: "Jejak perubahan data bisnis.",
    endpoint: "/api/v1/audit-logs",
    columns: [
      ["created_at", "Waktu"],
      ["action", "Aksi"],
      ["entity_type", "Section"],
      ["entity_id", "ID"],
      ["actor_name", "Aktor"],
    ],
  },
  "reports-financial": {
    title: "Laporan Keuangan",
    description:
      "Revenue, penerimaan, piutang, biaya, dan recorded gross profit.",
    endpoint: "/api/v1/reports/financial",
    columns: [
      ["revenueIdr", "Revenue"],
      ["collectedIdr", "Diterima"],
      ["outstandingIdr", "Piutang"],
      ["expensesIdr", "Biaya"],
      ["recordedGrossProfitIdr", "Recorded Gross Profit"],
    ],
  },
};
export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (section === "packages") return <PackagesPage />;
  if (section === "closings") return <ClosingsPage />;
  if (section === "shipping-history") return <ShippingHistoryPage />;
  if (section === "users") return <UsersPage />;
  const config = configs[section];
  if (!config) notFound();
  return <ResourcePage config={config} />;
}
