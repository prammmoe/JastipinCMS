import "server-only";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createAdminClient } from "@/server/supabase/clients";
import { AppError, mapDatabaseError } from "@/server/errors/app-error";
import { prepareClosingExportData } from "@/features/closings/export/closing-export.mapper";
import { prepareClosingExportLayout } from "@/features/closings/export/closing-export-grouping";
import { generateClosingPdf } from "@/features/closings/export/closing-pdf.renderer";
import { formatTitleDate } from "@/features/closings/export/closing-pdf.utils";

type SourceClosing = {
  id: string;
  code: string;
  closing_date: string;
  closing_packages: {
    shipping_fee_snapshot_idr: string | number | null;
    chargeable_weight_snapshot_kg: number | null;
    is_active: boolean | null;
    packages: {
      id: string;
      tracking_number: string;
      shipping_fee_idr: number | null;
      customer_id: string | null;
      charge_type: string;
      length_cm: number | null;
      width_cm: number | null;
      height_cm: number | null;
      customers: { id: string; name: string } | null;
    };
  }[];
};

const BORDER = {
  top: { style: "thin" as const },
  left: { style: "thin" as const },
  bottom: { style: "thin" as const },
  right: { style: "thin" as const },
};

export async function exportClosingDocument(id: string, format: string) {
  if (!["pdf", "xlsx", "csv"].includes(format))
    throw new AppError(
      "VALIDATION_ERROR",
      "Format export harus pdf, xlsx, atau csv.",
    );
  const result = await createAdminClient()
    .from("closings")
    .select(
      "id,code,closing_date,closing_packages(shipping_fee_snapshot_idr,chargeable_weight_snapshot_kg,is_active,packages(id,tracking_number,shipping_fee_idr,customer_id,charge_type,length_cm,width_cm,height_cm,customers(id,name)))",
    )
    .eq("id", id)
    .single();
  if (result.error) mapDatabaseError(result.error);
  const closing = result.data as unknown as SourceClosing;
  const active = (closing.closing_packages ?? []).filter(
    (item) => item.is_active !== false,
  );
  const exportData = prepareClosingExportData(closing, active);

  if (format === "pdf") {
    const layout = prepareClosingExportLayout(exportData);
    const bytes = await generateClosingPdf(exportData, layout);
    const [year, month, day] = closing.closing_date.split("-");
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="JASTIPin BRG - CL ${day}_${month}_${year}.pdf"`,
      },
    });
  }

  if (format === "xlsx") {
    return exportClosingExcel(exportData);
  }

  return exportClosingCsv(exportData);
}

function exportClosingExcel(
  exportData: ReturnType<typeof prepareClosingExportData>,
) {
  const layout = prepareClosingExportLayout(exportData);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Closing");
  sheet.columns = [
    { key: "no", width: 8 },
    { key: "name", width: 30 },
    { key: "tracking", width: 30 },
    { key: "weight", width: 14 },
    { key: "unit", width: 16 },
    { key: "total", width: 18 },
  ];
  const titleRow = 1;
  const headerRow1 = 2;
  const headerRow2 = 3;

  sheet.mergeCells(titleRow, 1, titleRow, 6);
  const title = sheet.getCell(titleRow, 1);
  title.value = `CLOSING JASTIPin TANGGAL ${formatTitleDate(
    exportData.closingDate,
  )}`;
  title.font = { bold: true, size: 13 };
  title.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFC9DAF8" },
  };
  title.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(titleRow).height = 26;

  sheet.getCell(headerRow1, 1).value = "NO.";
  sheet.getCell(headerRow1, 2).value = "NAMA";
  sheet.getCell(headerRow1, 3).value = "NO RESI";
  sheet.getCell(headerRow1, 4).value = "BERAT";
  sheet.mergeCells(headerRow1, 5, headerRow1, 6);
  sheet.getCell(headerRow1, 5).value = "ONGKIR";
  sheet.getCell(headerRow2, 5).value = "SATUAN";
  sheet.getCell(headerRow2, 6).value = "TOTAL";
  for (let row = headerRow1; row <= headerRow2; row += 1) {
    for (let col = 1; col <= 6; col += 1) {
      const cell = sheet.getCell(row, col);
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF4CCCC" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = BORDER;
    }
  }

  let row = headerRow2 + 1;
  for (const group of layout.groups) {
    const unknown = group.customerId == null;
    const firstDataRow = row;
    for (const exportRow of group.rows) {
      const cell = sheet.getCell(row, 1);
      cell.value = exportRow.number;
      sheet.getCell(row, 2).value = exportRow.item.customerName;
      sheet.getCell(row, 3).value = exportRow.item.trackingNumber;
      sheet.getCell(row, 4).value = exportRow.item.weightDisplay;
      if (exportRow.unitCost != null) {
        const unit = sheet.getCell(row, 5);
        unit.value = exportRow.unitCost;
        unit.numFmt = '"Rp"#,##0';
        unit.alignment = { horizontal: "right" };
      }
      for (let col = 1; col <= 6; col += 1) {
        sheet.getCell(row, col).border = BORDER;
        if (unknown) {
          sheet.getCell(row, col).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFF00" },
          };
        }
      }
      row += 1;
    }
    const lastDataRow = row - 1;
    if (group.rows.length > 1) {
      sheet.mergeCells(firstDataRow, 6, lastDataRow, 6);
    }
    const total = sheet.getCell(firstDataRow, 6);
    total.value = group.total;
    total.numFmt = '"Rp"#,##0';
    total.alignment = { horizontal: "right", vertical: "middle" };
    total.border = BORDER;
  }

  return workbook.xlsx.writeBuffer().then((output) =>
    new NextResponse(Buffer.from(output), {
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="${exportData.code}.xlsx"`,
      },
    }),
  );
}

function exportClosingCsv(
  exportData: ReturnType<typeof prepareClosingExportData>,
) {
  const layout = prepareClosingExportLayout(exportData);
  const lines = ["NO,NAMA,NO RESI,BERAT,SATUAN,TOTAL"];
  for (const group of layout.groups) {
    for (const exportRow of group.rows) {
      lines.push(
        [
          exportRow.number,
          exportRow.item.customerName,
          exportRow.item.trackingNumber,
          exportRow.item.weightDisplay,
          exportRow.unitCost != null ? exportRow.unitCost : "",
          exportRow.unitCost != null ? "" : exportRow.item.shippingCost,
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      );
    }
    lines.push(
      ["", `TOTAL ${group.customerName}`, "", "", "", group.total]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    );
  }
  return new NextResponse(`\uFEFF${lines.join("\n")}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${exportData.code}.csv"`,
    },
  });
}