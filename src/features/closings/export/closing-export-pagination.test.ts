import { describe, expect, it } from "vitest";
import type { ClosingExportItem } from "./closing-export.types";
import { prepareClosingExportLayout, type ClosingExportRow } from "./closing-export-grouping";
import {
  groupTotalPage,
  pageContainingRow,
  paginateClosingRows,
} from "./closing-export-pagination";
import {
  formatRupiah,
  formatTitleDate,
  formatTrackingNumber,
} from "./closing-pdf.utils";

function rows(count: number): ClosingExportRow[] {
  const items: ClosingExportItem[] = [];
  for (let index = 1; index <= count; index += 1) {
    items.push({
      id: `p${index}`,
      customerId: `c${index}`,
      customerName: `CUSTOMER ${index}`,
      trackingNumber: `JY${index}`,
      weightDisplay: "1",
      shippingCost: 10000,
    });
  }
  return prepareClosingExportLayout({
    id: "closing-1",
    code: "CLS-1",
    closingDate: "2026-08-17",
    items,
  }).rows;
}

describe("closing export pagination", () => {
  it("53 rows fit on one page", () => {
    expect(paginateClosingRows(rows(53)).map((page) => page.length)).toEqual([53]);
  });

  it("54 rows split into 53 + 1", () => {
    expect(paginateClosingRows(rows(54)).map((page) => page.length)).toEqual([53, 1]);
  });

  it("112 rows split into 53 + 59", () => {
    expect(paginateClosingRows(rows(112)).map((page) => page.length)).toEqual([53, 59]);
  });

  it("113 rows split into 53 + 59 + 1", () => {
    expect(paginateClosingRows(rows(113)).map((page) => page.length)).toEqual([53, 59, 1]);
  });

  it("numbers continue across pages", () => {
    const pages = paginateClosingRows(rows(112));
    expect(pages[0][0].number).toBe(1);
    expect(pages[0][pages[0].length - 1].number).toBe(53);
    expect(pages[1][0].number).toBe(54);
    expect(pages[1][pages[1].length - 1].number).toBe(112);
  });

  it("maps global row numbers to pages", () => {
    expect(pageContainingRow(1)).toBe(1);
    expect(pageContainingRow(53)).toBe(1);
    expect(pageContainingRow(54)).toBe(2);
    expect(pageContainingRow(112)).toBe(2);
    expect(pageContainingRow(113)).toBe(3);
  });

  it("renders a group total exactly once when the group crosses a page", () => {
    const group = { startIndex: 53, endIndex: 54 };
    expect(groupTotalPage(group)).toBe(2);
    const single = { startIndex: 1, endIndex: 1 };
    expect(groupTotalPage(single)).toBe(1);
  });
});

describe("closing export currency and date formatting", () => {
  it("formats rupiah with Indonesian grouping", () => {
    expect(formatRupiah(4900)).toBe("4.900");
    expect(formatRupiah(31200)).toBe("31.200");
    expect(formatRupiah(317100)).toBe("317.100");
    expect(formatRupiah(2543800)).toBe("2.543.800");
  });

  it("formats closing date as uppercase Indonesian", () => {
    expect(formatTitleDate("2026-07-27")).toBe("27 JULI 2026");
    expect(formatTitleDate("2026-08-17")).toBe("17 AGUSTUS 2026");
    expect(formatTitleDate("2026-09-02")).toBe("02 SEPTEMBER 2026");
  });

  it("normalizes known courier prefixes for display", () => {
    expect(formatTrackingNumber("SPXID063642403457")).toBe("SPXID 063642403457");
    expect(formatTrackingNumber("FWSDA123456")).toBe("FWSDA 123456");
    expect(formatTrackingNumber("JY1052184317")).toBe("JY1052184317");
  });
});