import { join } from "node:path";
import { readFileSync } from "node:fs";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { FONT_PATHS } from "@/features/closings/export/closing-pdf.constants";
import {
  centeredTextX,
  fitTextToCell,
  formatTrackingNumber,
  safeText,
  verticallyCenteredBaseline,
} from "@/features/closings/export/closing-pdf.utils";
import { RECEIVED_PDF_LAYOUT } from "./received-pdf.constants";

type PdfFonts = { regular: PDFFont; bold: PDFFont };

export type ReceivedReportRow = {
  number: number;
  date: string;
  name: string;
  trackingNumber: string;
  weight: string;
};

export type ReceivedReportData = {
  title: string;
  subtitle: string;
  rows: ReceivedReportRow[];
};

export function formatReportDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${day}/${month}/${year}`;
}

function rowsPerPage(firstPage: boolean): number {
  const { page, margin, title, subtitle, header, row } = RECEIVED_PDF_LAYOUT;
  const block = firstPage
    ? title.fontSize + title.gap + subtitle.fontSize + subtitle.gap
    : 0;
  const available = page.height - margin.top - block - header.height - margin.bottom;
  return Math.max(1, Math.floor(available / row.height));
}

export function paginateReceivedRows(
  rows: ReceivedReportRow[],
): ReceivedReportRow[][] {
  if (!rows.length) return [[]];
  const first = rowsPerPage(true);
  const continuation = rowsPerPage(false);
  const pages: ReceivedReportRow[][] = [rows.slice(0, first)];
  let cursor = first;
  while (cursor < rows.length) {
    pages.push(rows.slice(cursor, cursor + continuation));
    cursor += continuation;
  }
  return pages;
}

function drawTitle(page: PDFPage, fonts: PdfFonts, data: ReceivedReportData) {
  const { margin, title, subtitle } = RECEIVED_PDF_LAYOUT;
  const centerX = RECEIVED_PDF_LAYOUT.page.width / 2;
  const titleBaseline =
    RECEIVED_PDF_LAYOUT.page.height - margin.top - title.fontSize * 0.75;
  page.drawText(data.title, {
    x: centeredTextX(fonts.bold, data.title, title.fontSize, centerX),
    y: titleBaseline,
    size: title.fontSize,
    font: fonts.bold,
    color: rgb(0, 0, 0),
  });
  const subtitleBaseline =
    titleBaseline - title.fontSize - title.gap - subtitle.fontSize * 0.75;
  page.drawText(data.subtitle, {
    x: centeredTextX(fonts.regular, data.subtitle, subtitle.fontSize, centerX),
    y: subtitleBaseline,
    size: subtitle.fontSize,
    font: fonts.regular,
    color: rgb(0, 0, 0),
  });
}

function drawHeader(page: PDFPage, fonts: PdfFonts, topY: number) {
  const { columns, header } = RECEIVED_PDF_LAYOUT;
  const bottomY = topY - header.height;
  const border = rgb(0, 0, 0);
  page.drawRectangle({
    x: columns.no,
    y: bottomY,
    width: columns.right - columns.no,
    height: header.height,
    borderColor: border,
    borderWidth: 0.6,
  });
  for (const vx of [columns.tanggal, columns.nama, columns.resi, columns.berat]) {
    page.drawLine({
      start: { x: vx, y: topY },
      end: { x: vx, y: bottomY },
      thickness: 0.6,
      color: border,
    });
  }
  const baseline = verticallyCenteredBaseline(
    topY,
    bottomY,
    fonts.bold,
    header.fontSize,
  );
  const draw = (label: string, x1: number, x2: number) =>
    page.drawText(label, {
      x: centeredTextX(fonts.bold, label, header.fontSize, (x1 + x2) / 2),
      y: baseline,
      size: header.fontSize,
      font: fonts.bold,
      color: rgb(0, 0, 0),
    });
  draw("NO.", columns.no, columns.tanggal);
  draw("TANGGAL", columns.tanggal, columns.nama);
  draw("NAMA", columns.nama, columns.resi);
  draw("NO RESI", columns.resi, columns.berat);
  draw("BERAT", columns.berat, columns.right);
}

function drawRows(
  page: PDFPage,
  fonts: PdfFonts,
  rows: ReceivedReportRow[],
  topY: number,
) {
  const { columns, row, text } = RECEIVED_PDF_LAYOUT;
  const border = rgb(0, 0, 0);
  const lineCount = Math.max(1, rows.length);
  const bottomY = topY - lineCount * row.height;
  for (const vx of [
    columns.no,
    columns.tanggal,
    columns.nama,
    columns.resi,
    columns.berat,
    columns.right,
  ]) {
    page.drawLine({
      start: { x: vx, y: topY },
      end: { x: vx, y: bottomY },
      thickness: 0.6,
      color: border,
    });
  }
  for (let boundary = 0; boundary <= lineCount; boundary += 1) {
    const y = topY - boundary * row.height;
    page.drawLine({
      start: { x: columns.no, y },
      end: { x: columns.right, y },
      thickness: 0.6,
      color: border,
    });
  }
  if (!rows.length) {
    const baseline = verticallyCenteredBaseline(
      topY,
      bottomY,
      fonts.regular,
      row.fontSize,
    );
    const message = "TIDAK ADA PAKET PADA PERIODE INI.";
    page.drawText(message, {
      x: centeredTextX(
        fonts.regular,
        message,
        row.fontSize,
        (columns.no + columns.right) / 2,
      ),
      y: baseline,
      size: row.fontSize,
      font: fonts.regular,
      color: rgb(0, 0, 0),
    });
    return;
  }
  let previousDate = "";
  rows.forEach((rowData, index) => {
    const rowTopY = topY - index * row.height;
    const rowBottomY = rowTopY - row.height;
    const baseline = verticallyCenteredBaseline(
      rowTopY,
      rowBottomY,
      fonts.regular,
      row.fontSize,
    );
    const numberText = String(rowData.number);
    page.drawText(numberText, {
      x: centeredTextX(
        fonts.regular,
        numberText,
        row.fontSize,
        (columns.no + columns.tanggal) / 2,
      ),
      y: baseline,
      size: row.fontSize,
      font: fonts.regular,
      color: rgb(0, 0, 0),
    });
    if (rowData.date !== previousDate) {
      const dateText = formatReportDate(rowData.date);
      page.drawText(dateText, {
        x: centeredTextX(
          fonts.regular,
          dateText,
          row.fontSize,
          (columns.tanggal + columns.nama) / 2,
        ),
        y: baseline,
        size: row.fontSize,
        font: fonts.regular,
        color: rgb(0, 0, 0),
      });
    }
    previousDate = rowData.date;
    const name = fitTextToCell(
      fonts.regular,
      safeText(rowData.name),
      columns.resi - columns.nama - text.paddingLeft * 2,
      row.fontSize,
      row.minFontSize,
    );
    page.drawText(name.text, {
      x: columns.nama + text.paddingLeft,
      y: baseline,
      size: name.size,
      font: fonts.regular,
      color: rgb(0, 0, 0),
    });
    const tracking = fitTextToCell(
      fonts.regular,
      safeText(formatTrackingNumber(rowData.trackingNumber)),
      columns.berat - columns.resi - text.paddingLeft * 2,
      row.fontSize,
      row.minFontSize,
    );
    page.drawText(tracking.text, {
      x: columns.resi + text.paddingLeft,
      y: baseline,
      size: tracking.size,
      font: fonts.regular,
      color: rgb(0, 0, 0),
    });
    if (rowData.weight) {
      const weightText = rowData.weight;
      page.drawText(weightText, {
        x: centeredTextX(
          fonts.regular,
          weightText,
          row.fontSize,
          (columns.berat + columns.right) / 2,
        ),
        y: baseline,
        size: row.fontSize,
        font: fonts.regular,
        color: rgb(0, 0, 0),
      });
    }
  });
}

export async function generateReceivedPdf(
  data: ReceivedReportData,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts: PdfFonts = {
    regular: await doc.embedFont(
      readFileSync(join(process.cwd(), FONT_PATHS.regular)),
    ),
    bold: await doc.embedFont(
      readFileSync(join(process.cwd(), FONT_PATHS.bold)),
    ),
  };
  const pages = paginateReceivedRows(data.rows);
  pages.forEach((pageRows, pageIndex) => {
    const page = doc.addPage([
      RECEIVED_PDF_LAYOUT.page.width,
      RECEIVED_PDF_LAYOUT.page.height,
    ]);
    let tableTop =
      RECEIVED_PDF_LAYOUT.page.height - RECEIVED_PDF_LAYOUT.margin.top;
    if (pageIndex === 0) {
      drawTitle(page, fonts, data);
      const { title, subtitle } = RECEIVED_PDF_LAYOUT;
      tableTop -= title.fontSize + title.gap + subtitle.fontSize + subtitle.gap;
    }
    drawHeader(page, fonts, tableTop);
    drawRows(page, fonts, pageRows, tableTop - RECEIVED_PDF_LAYOUT.header.height);
  });
  return doc.save();
}
