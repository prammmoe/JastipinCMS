import { join } from "node:path";
import { readFileSync } from "node:fs";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {
  FONT_PATHS,
  HEADER_SUBLINE_X1,
  HEADER_SUBLINE_Y,
  PDF_LAYOUT,
  PDF_LAYOUT_DEBUG,
} from "./closing-pdf.constants";
import {
  centeredTextX,
  CLOSING_PDF_COLORS,
  drawRightAlignedText,
  fitTextToCell,
  formatRupiah,
  formatTitleDate,
  formatTrackingNumber,
  pdfY,
  verticallyCenteredBaseline,
} from "./closing-pdf.utils";
import { groupTotalPage, paginateClosingRows } from "./closing-export-pagination";
import type {
  ClosingExportGroup,
  ClosingExportLayout,
  ClosingExportRow,
} from "./closing-export-grouping";
import type { ClosingExportData } from "./closing-export.types";

type PdfFonts = {
  regular: PDFFont;
  bold: PDFFont;
};

type DrawContext = {
  page: PDFPage;
  fonts: PdfFonts;
  rows: ClosingExportRow[];
  pageIndex: number;
  layout: ClosingExportLayout;
  totalPageByGroup: Map<number, number>;
  data: ClosingExportData;
};

const { columns, body, border, text: textLayout } = PDF_LAYOUT;

function isUnknownGroup(group: ClosingExportGroup) {
  return group.customerId == null;
}

function drawTitle(page: PDFPage, fonts: PdfFonts, data: ClosingExportData) {
  const { left, right, top, bottom, fontSize } = PDF_LAYOUT.title;
  const width = right - left;
  const topY = pdfY(top);
  const bottomY = pdfY(bottom);
  page.drawRectangle({
    x: left,
    y: bottomY,
    width,
    height: bottom - top,
    color: CLOSING_PDF_COLORS.title,
    borderColor: CLOSING_PDF_COLORS.border,
    borderWidth: border.width,
  });
  const text = `CLOSING JASTIPin TANGGAL ${formatTitleDate(data.closingDate)}`;
  const baseline = verticallyCenteredBaseline(topY, bottomY, fonts.bold, fontSize);
  page.drawText(text, {
    x: centeredTextX(fonts.bold, text, fontSize, left + width / 2),
    y: baseline,
    size: fontSize,
    font: fonts.bold,
    color: CLOSING_PDF_COLORS.text,
  });
}

function drawHeader(page: PDFPage, fonts: PdfFonts) {
  const { top, middle, bottom, fontSize } = PDF_LAYOUT.header;
  const topY = pdfY(top);
  const midY = pdfY(middle);
  const bottomY = pdfY(bottom);
  const width = columns.right - columns.left;
  page.drawRectangle({
    x: columns.left,
    y: bottomY,
    width,
    height: bottom - top,
    color: CLOSING_PDF_COLORS.header,
    borderColor: CLOSING_PDF_COLORS.border,
    borderWidth: border.width,
  });
  for (const vx of [columns.no, columns.name, columns.resi, columns.weight]) {
    page.drawLine({
      start: { x: vx, y: topY },
      end: { x: vx, y: bottomY },
      thickness: border.width,
      color: CLOSING_PDF_COLORS.border,
    });
  }
  page.drawLine({
    start: { x: columns.unit, y: midY },
    end: { x: columns.unit, y: bottomY },
    thickness: border.width,
    color: CLOSING_PDF_COLORS.border,
  });
  page.drawLine({
    start: { x: HEADER_SUBLINE_X1, y: pdfY(HEADER_SUBLINE_Y) },
    end: { x: columns.right, y: pdfY(HEADER_SUBLINE_Y) },
    thickness: border.width,
    color: CLOSING_PDF_COLORS.border,
  });

  const center = (x1: number, x2: number) => (x1 + x2) / 2;
  const baseFull = verticallyCenteredBaseline(topY, bottomY, fonts.bold, fontSize);
  const baseTop = verticallyCenteredBaseline(topY, midY, fonts.bold, fontSize);
  const baseBottom = verticallyCenteredBaseline(midY, bottomY, fonts.bold, fontSize);
  const draw = (text: string, x: number, baseline: number) =>
    page.drawText(text, {
      x: centeredTextX(fonts.bold, text, fontSize, x),
      y: baseline,
      size: fontSize,
      font: fonts.bold,
      color: CLOSING_PDF_COLORS.text,
    });
  draw("NO.", center(columns.left, columns.no), baseFull);
  draw("NAMA", center(columns.no, columns.name), baseFull);
  draw("NO RESI", center(columns.name, columns.resi), baseFull);
  draw("BERAT", center(columns.resi, columns.weight), baseFull);
  draw("ONGKIR", center(columns.weight, columns.right), baseTop);
  draw("SATUAN", center(columns.weight, columns.unit), baseBottom);
  draw("TOTAL", center(columns.unit, columns.right), baseBottom);
}

function drawMoneyPair(
  page: PDFPage,
  font: PDFFont,
  value: number,
  spec: { rpX: number; valueRight: number },
  baseline: number,
) {
  page.drawText("Rp", {
    x: spec.rpX,
    y: baseline,
    size: body.fontSize,
    font,
    color: CLOSING_PDF_COLORS.text,
  });
  drawRightAlignedText(
    page,
    font,
    formatRupiah(value),
    body.fontSize,
    spec.valueRight,
    baseline,
  );
}

function drawRows(ctx: DrawContext) {
  const { page, fonts, rows, layout, totalPageByGroup } = ctx;
  const pageNumber = ctx.pageIndex + 1;
  const rowHeight = body.rowHeight;
  const top = pdfY(body.firstRowTop);
  const bandBottomY = top - rows.length * rowHeight;

  for (const vx of [
    columns.left,
    columns.no,
    columns.name,
    columns.resi,
    columns.weight,
    columns.unit,
    columns.right,
  ]) {
    page.drawLine({
      start: { x: vx, y: top },
      end: { x: vx, y: bandBottomY },
      thickness: border.width,
      color: CLOSING_PDF_COLORS.border,
    });
  }

  for (let boundary = 0; boundary <= rows.length; boundary += 1) {
    const y = top - boundary * rowHeight;
    const prev = rows[boundary - 1];
    const next = rows[boundary];
    const prevGroup = prev ? layout.groups[prev.groupIndex] : undefined;
    const nextGroup = next ? layout.groups[next.groupIndex] : undefined;
    const isGroupStartAfter = !!next && next.number === nextGroup!.startIndex;
    const topOfBand = boundary === 0;
    const bottomOfBand = boundary === rows.length;
    const drawTotalLine =
      (bottomOfBand && !!prev && prev.number === prevGroup!.endIndex) ||
      isGroupStartAfter ||
      (topOfBand && ctx.pageIndex === 0);
    page.drawLine({
      start: { x: columns.left, y },
      end: { x: columns.unit, y },
      thickness: border.width,
      color: CLOSING_PDF_COLORS.border,
    });
    if (drawTotalLine) {
      page.drawLine({
        start: { x: columns.unit, y },
        end: { x: columns.right, y },
        thickness: border.width,
        color: CLOSING_PDF_COLORS.border,
      });
    }
  }

  const groupLocalBounds = new Map<number, { first: number; last: number }>();
  rows.forEach((row, index) => {
    const bounds = groupLocalBounds.get(row.groupIndex) ?? { first: index, last: index };
    bounds.last = index;
    groupLocalBounds.set(row.groupIndex, bounds);
  });

  rows.forEach((row, localIndex) => {
    const group = layout.groups[row.groupIndex];
    const rowTopY = top - localIndex * rowHeight;
    const rowBottomY = top - (localIndex + 1) * rowHeight;
    const baseline = verticallyCenteredBaseline(rowTopY, rowBottomY, fonts.regular, body.fontSize);

    if (isUnknownGroup(group)) {
      page.drawRectangle({
        x: columns.left,
        y: rowBottomY,
        width: columns.right - columns.left,
        height: rowHeight,
        color: CLOSING_PDF_COLORS.unknownCustomer,
        borderWidth: 0,
      });
    }

    const draw = (
      text: string,
      x: number,
      size: number = body.fontSize,
      align: "left" | "center" = "left",
    ) => {
      if (align === "center") {
        page.drawText(text, {
          x: centeredTextX(fonts.regular, text, size, x),
          y: baseline,
          size,
          font: fonts.regular,
          color: CLOSING_PDF_COLORS.text,
        });
      } else {
        page.drawText(text, {
          x: x + textLayout.paddingLeft,
          y: baseline,
          size,
          font: fonts.regular,
          color: CLOSING_PDF_COLORS.text,
        });
      }
    };

    const numberText = String(row.number);
    draw(numberText, (columns.left + columns.no) / 2, body.fontSize, "center");

    const name = fitTextToCell(
      fonts.regular,
      row.item.customerName.toUpperCase(),
      columns.name - columns.no - textLayout.paddingLeft * 2,
      body.fontSize,
      body.minFontSize,
    );
    draw(name.text, columns.no, name.size);

    const tracking = fitTextToCell(
      fonts.regular,
      formatTrackingNumber(row.item.trackingNumber),
      columns.resi - columns.name - textLayout.paddingLeft * 2,
      body.fontSize,
      body.minFontSize,
    );
    draw(tracking.text, columns.name, tracking.size);

    draw(row.item.weightDisplay, (columns.resi + columns.weight) / 2, body.fontSize, "center");

    if (row.unitCost != null) {
      drawMoneyPair(page, fonts.regular, row.unitCost, PDF_LAYOUT.money.unit, baseline);
    }

    const bounds = groupLocalBounds.get(row.groupIndex)!;
    if (bounds.first === localIndex && totalPageByGroup.get(row.groupIndex) === pageNumber) {
      const groupTopY = top - bounds.first * rowHeight;
      const groupBottomY = top - (bounds.last + 1) * rowHeight;
      const groupBaseline = verticallyCenteredBaseline(
        groupTopY,
        groupBottomY,
        fonts.regular,
        body.fontSize,
      );
      drawMoneyPair(page, fonts.regular, group.total, PDF_LAYOUT.money.total, groupBaseline);
    }
  });
}

function drawDebugGuides(ctx: DrawContext) {
  const { page, rows } = ctx;
  const topY = pdfY(ctx.pageIndex === 0 ? PDF_LAYOUT.header.top : body.firstRowTop);
  const bandBottomY = topY - rows.length * body.rowHeight;
  for (const vx of [
    columns.left,
    columns.no,
    columns.name,
    columns.resi,
    columns.weight,
    columns.unit,
    columns.right,
  ]) {
    page.drawLine({
      start: { x: vx, y: topY },
      end: { x: vx, y: bandBottomY },
      thickness: 0.5,
      color: rgb(0, 0, 1),
    });
  }
  page.drawLine({
    start: { x: columns.left, y: pdfY(HEADER_SUBLINE_Y) },
    end: { x: columns.right, y: pdfY(HEADER_SUBLINE_Y) },
    thickness: 0.5,
    color: rgb(1, 0, 0),
  });
}

export async function generateClosingPdf(
  data: ClosingExportData,
  layout: ClosingExportLayout,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const fonts: PdfFonts = {
    regular: await pdfDoc.embedFont(
      readFileSync(join(process.cwd(), FONT_PATHS.regular)),
    ),
    bold: await pdfDoc.embedFont(
      readFileSync(join(process.cwd(), FONT_PATHS.bold)),
    ),
  };
  const pages = paginateClosingRows(layout.rows);
  if (!pages.length) pages.push([]);
  const totalPageByGroup = new Map<number, number>();
  layout.groups.forEach((group, index) =>
    totalPageByGroup.set(index, groupTotalPage(group)),
  );
  pages.forEach((pageRows, pageIndex) => {
    const page = pdfDoc.addPage([
      PDF_LAYOUT.page.width,
      PDF_LAYOUT.page.height,
    ]);
    const ctx: DrawContext = {
      page,
      fonts,
      rows: pageRows,
      pageIndex,
      layout,
      totalPageByGroup,
      data,
    };
    if (pageIndex === 0) {
      drawTitle(page, fonts, data);
      drawHeader(page, fonts);
    }
    drawRows(ctx);
    if (PDF_LAYOUT_DEBUG) drawDebugGuides(ctx);
  });
  return pdfDoc.save();
}