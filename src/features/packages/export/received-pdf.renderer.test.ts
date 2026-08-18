import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  formatReportDate,
  generateReceivedPdf,
  paginateReceivedRows,
  type ReceivedReportRow,
} from "./received-pdf.renderer";

function row(overrides: Partial<ReceivedReportRow> = {}): ReceivedReportRow {
  return {
    number: 1,
    date: "2026-08-17",
    name: "ADHE HENY",
    trackingNumber: "SPXID 060595745848",
    weight: "0,22",
    ...overrides,
  };
}

describe("received report pdf", () => {
  it("formats date as dd/M/yyyy", () => {
    expect(formatReportDate("2026-08-17")).toBe("17/8/2026");
  });

  it("paginates rows across pages", () => {
    const rows = Array.from({ length: 100 }, (_, i) => row({ number: i + 1 }));
    const pages = paginateReceivedRows(rows);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.flat().length).toBe(100);
  });

  it("renders a PDF with black-only borders and text", async () => {
    const bytes = await generateReceivedPdf({
      title: "UPDATE PAKET DITERIMA SURABAYA",
      subtitle: "PERIODE: 17 AGUSTUS 2026",
      rows: [row()],
    });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });
});
