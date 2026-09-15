import type {
  ClosingExportData,
  ClosingExportItem,
} from "./closing-export.types";

export type ClosingExportRow = {
  number: number;
  groupIndex: number;
  item: ClosingExportItem;
  unitCost: number | null;
};

export type ClosingExportGroup = {
  key: string;
  customerId: string | null;
  customerName: string;
  total: number;
  startIndex: number;
  endIndex: number;
  rows: ClosingExportRow[];
};

export type ClosingExportLayout = {
  groups: ClosingExportGroup[];
  rows: ClosingExportRow[];
};

export function groupKeyForItem(item: ClosingExportItem): string {
  return item.customerId ?? item.id;
}

export function prepareClosingExportLayout(
  data: ClosingExportData,
): ClosingExportLayout {
  const byKey = new Map<string, ClosingExportItem[]>();
  for (const item of data.items) {
    const key = groupKeyForItem(item);
    const list = byKey.get(key) ?? [];
    list.push(item);
    byKey.set(key, list);
  }
  const entries = [...byKey.entries()];
  entries.sort((a, b) =>
    a[1][0].customerName.localeCompare(b[1][0].customerName, "id"),
  );
  const groups: ClosingExportGroup[] = [];
  const rows: ClosingExportRow[] = [];
  let number = 0;
  entries.forEach(([key, items]) => {
    const first = items[0];
    const isMulti = items.length > 1;
    const startIndex = number + 1;
    const total = items.reduce(
      (sum, item) => sum + item.shippingCost,
      0,
    );
    const groupRows: ClosingExportRow[] = [];
    for (const item of items) {
      number += 1;
      groupRows.push({
        number,
        groupIndex: groups.length,
        item,
        unitCost: isMulti ? item.shippingCost : null,
      });
    }
    groups.push({
      key,
      customerId: first.customerId,
      customerName: first.customerName,
      total,
      startIndex,
      endIndex: number,
      rows: groupRows,
    });
    rows.push(...groupRows);
  });
  return { groups, rows };
}