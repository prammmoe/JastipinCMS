import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/server/supabase/clients";
import { mapDatabaseError } from "@/server/errors/app-error";
import { indonesianDecimal } from "@/features/closings/export/closing-export.mapper";
import {
  generateReceivedPdf,
  type ReceivedReportData,
  type ReceivedReportRow,
} from "@/features/packages/export/received-pdf.renderer";

type PackageSource = {
  id: string;
  tracking_number: string;
  received_date: string;
  actual_weight_kg: number | null;
  customers: { name: string } | null;
};

function formatPeriod(from?: string, to?: string): string {
  const label = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };
  if (from && to) return `PERIODE: ${label(from)} - ${label(to)}`;
  if (from) return `PERIODE: ${label(from)}`;
  if (to) return `PERIODE: ${label(to)}`;
  return "PERIODE: SEMUA WAKTU";
}

export async function exportReceivedPackagesPdf(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const from = params.get("dateFrom") ?? undefined;
  const to = params.get("dateTo") ?? undefined;
  const status = params.get("status") ?? "WAITING_CLOSING";
  const customerId = params.get("customerId") ?? undefined;

  const client = createAdminClient();

  const sequenceResult = await client
    .from("packages")
    .select("id,received_date,received_time")
    .order("received_date", { ascending: true })
    .order("received_time", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true });
  if (sequenceResult.error) mapDatabaseError(sequenceResult.error);
  const sequence = new Map<string, number>();
  (sequenceResult.data ?? []).forEach((row, index) =>
    sequence.set(row.id, index + 1),
  );

  let query = client
    .from("packages")
    .select("id,tracking_number,received_date,actual_weight_kg,customers(name)")
    .order("received_date", { ascending: true })
    .order("received_time", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true })
    .limit(10000);
  if (from) query = query.gte("received_date", from);
  if (to) query = query.lte("received_date", to);
  if (status) query = query.eq("status", status);
  if (customerId) query = query.eq("customer_id", customerId);
  const result = await query;
  if (result.error) mapDatabaseError(result.error);

  const rows: ReceivedReportRow[] = (result.data ?? []).map(
    (raw) => {
      const pkg = raw as unknown as PackageSource;
      return {
        number: sequence.get(pkg.id) ?? 0,
        date: pkg.received_date,
        name: (pkg.customers?.name ?? "").toUpperCase(),
        trackingNumber: pkg.tracking_number,
        weight:
          pkg.actual_weight_kg != null
            ? indonesianDecimal(Number(pkg.actual_weight_kg))
            : "",
      };
    },
  );

  const data: ReceivedReportData = {
    title: "UPDATE PAKET DITERIMA SURABAYA",
    subtitle: formatPeriod(from, to),
    rows,
  };
  const bytes = await generateReceivedPdf(data);
  const [year, month, day] = (from ?? to ?? "").split("-");
  const datePart =
    year && month && day ? `${day}-${month}-${year}` : "all-time";
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="Update Paket Diterima ${datePart}.pdf"`,
    },
  });
}
