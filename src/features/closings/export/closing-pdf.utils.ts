import { rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { PDF_LAYOUT } from "./closing-pdf.constants";

export function pdfY(top: number, height = 0): number {
  return PDF_LAYOUT.page.height - top - height;
}

export const CLOSING_PDF_COLORS = {
  title: rgb(201 / 255, 218 / 255, 248 / 255),
  header: rgb(244 / 255, 204 / 255, 204 / 255),
  unknownCustomer: rgb(255 / 255, 255 / 255, 0 / 255),
  border: rgb(0, 0, 0),
  text: rgb(0, 0, 0),
};

type FontMetrics = { ascent: number; descent: number; unitsPerEm: number };

export function fontMetrics(font: PDFFont): FontMetrics {
  const embedder = (font as unknown as { embedder?: { font?: FontMetrics } })
    .embedder;
  const metrics = embedder?.font;
  if (metrics && metrics.unitsPerEm > 0) {
    return {
      ascent: metrics.ascent,
      descent: Math.abs(metrics.descent),
      unitsPerEm: metrics.unitsPerEm,
    };
  }
  return { ascent: 0.8, descent: 0.2, unitsPerEm: 1 };
}

export function verticallyCenteredBaseline(
  boxTopY: number,
  boxBottomY: number,
  font: PDFFont,
  size: number,
): number {
  const { ascent, descent, unitsPerEm } = fontMetrics(font);
  const ascentPx = (ascent / unitsPerEm) * size;
  const descentPx = (descent / unitsPerEm) * size;
  const centerY = (boxTopY + boxBottomY) / 2;
  return centerY + (descentPx - ascentPx) / 2 + PDF_LAYOUT.text.verticalTune;
}

export function safeText(text: string): string {
  return text.replace(/[^\x20-\x7e\u00a0-\u00ff]/g, "?");
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
    value,
  );
}

export function formatTitleDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  const formatted = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
  return formatted.toUpperCase();
}

export function formatTrackingNumber(value: string): string {
  return value
    .trim()
    .replace(/^SPXID\s*/i, "SPXID ")
    .replace(/^FWSDA\s*/i, "FWSDA ");
}

export function centeredTextX(
  font: PDFFont,
  text: string,
  size: number,
  center: number,
): number {
  return center - font.widthOfTextAtSize(text, size) / 2;
}

export function fitTextToCell(
  font: PDFFont,
  rawText: string,
  maxWidth: number,
  defaultSize: number,
  minSize: number,
): { text: string; size: number } {
  let text = safeText(rawText);
  let size = defaultSize;
  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.25;
  }
  if (font.widthOfTextAtSize(text, size) > maxWidth) {
    let truncated = text;
    while (truncated.length > 1) {
      truncated = truncated.slice(0, -1);
      if (font.widthOfTextAtSize(`${truncated}...`, size) <= maxWidth) break;
    }
    text = `${truncated}...`;
  }
  return { text, size };
}

export function drawCellText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  size: number,
  x: number,
  baselineY: number,
  align: "left" | "center" | "right",
) {
  const clean = safeText(text);
  if (align === "center") {
    page.drawText(clean, {
      x: centeredTextX(font, clean, size, x),
      y: baselineY,
      size,
      font,
      color: CLOSING_PDF_COLORS.text,
    });
  } else {
    page.drawText(clean, {
      x:
        align === "right"
          ? x - font.widthOfTextAtSize(clean, size)
          : x + PDF_LAYOUT.text.paddingLeft,
      y: baselineY,
      size,
      font,
      color: CLOSING_PDF_COLORS.text,
    });
  }
}

export function drawRightAlignedText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  size: number,
  right: number,
  baselineY: number,
) {
  const clean = safeText(text);
  page.drawText(clean, {
    x: right - font.widthOfTextAtSize(clean, size),
    y: baselineY,
    size,
    font,
    color: CLOSING_PDF_COLORS.text,
  });
}