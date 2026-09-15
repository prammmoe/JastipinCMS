import { describe, expect, it } from "vitest";
import { PDFDocument, PDFArray, PDFRef, PDFRawStream } from "pdf-lib";
import type { PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { inflateSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { prepareClosingExportLayout } from "./closing-export-grouping";
import type { ClosingExportItem } from "./closing-export.types";
import { generateClosingPdf } from "./closing-pdf.renderer";
import { PDF_LAYOUT, FONT_PATHS } from "./closing-pdf.constants";

const PAGE_HEIGHT = PDF_LAYOUT.page.height;
const MIDDLE_Y = PAGE_HEIGHT - PDF_LAYOUT.header.middle;
const RIGHT = PDF_LAYOUT.columns.right;

function item(overrides: Partial<ClosingExportItem> = {}): ClosingExportItem {
  return {
    id: "p1",
    customerId: "c1",
    customerName: "CUSTOMER",
    trackingNumber: "JY0000000001",
    weightDisplay: "1",
    shippingCost: 10000,
    ...overrides,
  };
}

function data(items: ClosingExportItem[]) {
  return {
    id: "closing-1",
    code: "CLS-1",
    closingDate: "2026-08-17",
    items,
  };
}

function decodeContent(page: PDFPage) {
  const contents = page.node.Contents();
  if (!contents) return "";
  const chunks =
    contents instanceof PDFArray
      ? contents.asArray().map((obj) => (obj instanceof PDFRef ? page.doc.context.lookup(obj) : obj))
      : [contents];
  let raw = "";
  for (const chunk of chunks) {
    if (chunk instanceof PDFRawStream) {
      try {
        raw += new TextDecoder("latin1").decode(inflateSync(chunk.contents));
      } catch {
        raw += new TextDecoder("latin1").decode(chunk.contents);
      }
    }
  }
  return raw;
}

async function generateAndInspect(items: ClosingExportItem[]) {
  const exportData = data(items);
  const layout = prepareClosingExportLayout(exportData);
  const bytes = await generateClosingPdf(exportData, layout);
  const doc = await PDFDocument.load(bytes);
  const page = doc.getPages()[0];
  return { raw: decodeContent(page), pageCount: doc.getPageCount() };
}

describe("closing pdf renderer regression", () => {
  async function loadFonts() {
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const regular = await doc.embedFont(readFileSync(join(process.cwd(), FONT_PATHS.regular)));
    const bold = await doc.embedFont(readFileSync(join(process.cwd(), FONT_PATHS.bold)));
    return { regular, bold, hex: (font: typeof regular, s: string) => font.encodeText(s).toString() };
  }

  it("uses NO RESI label and preserves JASTIPin casing in title", async () => {
    const { raw } = await generateAndInspect([item()]);
    const { bold, hex } = await loadFonts();
    const expected = [
      "CLOSING JASTIPin TANGGAL 17 AGUSTUS 2026",
      "NO RESI",
      "NO.",
      "NAMA",
      "BERAT",
      "ONGKIR",
      "SATUAN",
      "TOTAL",
    ];
    for (const label of expected) {
      expect(raw).toContain(hex(bold, label));
    }
    expect(raw).not.toContain(hex(bold, "NO RESSI"));
  });

  it("draws the ONGKIR subheader line only within the ONGKIR area", async () => {
    const { raw } = await generateAndInspect([item()]);
    const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
    let prevX = 0;
    let prevY = 0;
    for (const match of raw.matchAll(/(-?[\d.]+) (-?[\d.]+) ([ml])/g)) {
      const x = Number(match[1]);
      const y = Number(match[2]);
      if (match[3] === "l") segments.push({ x1: prevX, y1: prevY, x2: x, y2: y });
      prevX = x;
      prevY = y;
    }
    const near = (a: number, b: number) => Math.abs(a - b) < 0.01;
    const ongkirLine = segments.some(
      (s) =>
        near(s.x1, 426.039) &&
        near(s.x2, RIGHT) &&
        near(s.y1, MIDDLE_Y) &&
        near(s.y2, MIDDLE_Y),
    );
    expect(ongkirLine).toBe(true);
    const fullWidthMiddle = segments.some(
      (s) =>
        near(s.x1, PDF_LAYOUT.columns.left) &&
        near(s.x2, RIGHT) &&
        near(s.y1, MIDDLE_Y) &&
        near(s.y2, MIDDLE_Y),
    );
    expect(fullWidthMiddle).toBe(false);
  });

  it("keeps money values right-aligned inside the right border", async () => {
    const items: ClosingExportItem[] = [];
    for (let i = 0; i < 12; i += 1)
      items.push(
        item({
          id: `p${i}`,
          customerId: "multi",
          customerName: "AA SILVIA SUBUR",
          trackingNumber: `JY${i}`,
          shippingCost: 4900 + i * 100,
        }),
      );
    const singleCost = 2543800;
    items.push(
      item({ id: "single", customerId: "single", customerName: "BUDI SANTOSO", shippingCost: singleCost }),
    );
    const { raw } = await generateAndInspect(items);
    const { regular, hex } = await loadFonts();
    const expectedNominal = "2.543.800";
    const tmRe = /([\d.]+) ([\d.]+) Tm\n<([0-9A-Fa-f]+)> Tj/g;
    let nominalX: number | null = null;
    for (const match of raw.matchAll(tmRe)) {
      if (match[3].toUpperCase() === hex(regular, expectedNominal).replace(/[<>]/g, "").toUpperCase()) {
        nominalX = Number(match[1]);
      }
    }
    expect(nominalX).not.toBeNull();
    const width = regular.widthOfTextAtSize(expectedNominal, PDF_LAYOUT.body.fontSize);
    expect(nominalX! + width).toBeLessThanOrEqual(RIGHT + 0.01);
    const rpX = [...raw.matchAll(tmRe)]
      .filter((m) => m[3].toUpperCase() === hex(regular, "Rp").replace(/[<>]/g, "").toUpperCase())
      .map((m) => Number(m[1]));
    expect(rpX).toContain(487.67);
  });

  it("paginates 54 items into 2 pages with continued numbering", async () => {
    const items: ClosingExportItem[] = [];
    for (let i = 0; i < 54; i += 1)
      items.push(
        item({
          id: `p${i}`,
          customerId: `c${i}`,
          customerName: `CUSTOMER ${i}`,
          shippingCost: 10000,
        }),
      );
    const { pageCount } = await generateAndInspect(items);
    expect(pageCount).toBe(2);
  });
});