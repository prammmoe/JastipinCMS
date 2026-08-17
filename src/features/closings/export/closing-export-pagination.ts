import type { ClosingExportRow } from "./closing-export-grouping";

export const PDF_PAGINATION = {
  firstPageRows: 53,
  continuationPageRows: 59,
} as const;

export function paginateClosingRows(
  rows: ClosingExportRow[],
): ClosingExportRow[][] {
  const { firstPageRows, continuationPageRows } = PDF_PAGINATION;
  if (!rows.length) return [];
  const pages: ClosingExportRow[][] = [];
  pages.push(rows.slice(0, firstPageRows));
  let cursor = firstPageRows;
  while (cursor < rows.length) {
    pages.push(rows.slice(cursor, cursor + continuationPageRows));
    cursor += continuationPageRows;
  }
  return pages;
}

export function pageContainingRow(
  rowNumber: number,
  firstPageRows = PDF_PAGINATION.firstPageRows,
  continuationPageRows = PDF_PAGINATION.continuationPageRows,
): number {
  if (rowNumber <= firstPageRows) return 1;
  const remaining = rowNumber - firstPageRows;
  return 2 + Math.floor((remaining - 1) / continuationPageRows);
}

export function groupTotalPage(group: {
  startIndex: number;
  endIndex: number;
}): number {
  const center = Math.ceil((group.startIndex + group.endIndex) / 2);
  return pageContainingRow(center);
}