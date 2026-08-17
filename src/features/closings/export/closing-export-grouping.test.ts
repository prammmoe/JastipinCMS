import { describe, expect, it } from "vitest";
import type { ClosingExportItem } from "./closing-export.types";
import { prepareClosingExportData } from "./closing-export.mapper";
import { prepareClosingExportLayout } from "./closing-export-grouping";

function item(overrides: Partial<ClosingExportItem>): ClosingExportItem {
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

function layout(items: ClosingExportItem[]) {
  return prepareClosingExportLayout({
    id: "closing-1",
    code: "CLS-1",
    closingDate: "2026-08-17",
    items,
  });
}

describe("closing export grouping", () => {
  it("single-item customer has blank unit cost and total equals item cost", () => {
    const result = layout([item({ customerName: "AKMAL FAJRI", shippingCost: 30000 })]);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].total).toBe(30000);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].unitCost).toBeNull();
  });

  it("multi-item customer has one unit cost per row and one merged total", () => {
    const result = layout(
      [4900, 4500, 14000, 7800].map((cost, index) =>
        item({
          id: `p${index}`,
          customerId: "c1",
          customerName: "AA SILVIA SUBUR",
          trackingNumber: `JY${index}`,
          shippingCost: cost,
        }),
      ),
    );
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].total).toBe(31200);
    expect(result.rows.map((row) => row.unitCost)).toEqual([4900, 4500, 14000, 7800]);
    expect(result.rows.map((row) => row.number)).toEqual([1, 2, 3, 4]);
  });

  it("NO NAME items are not merged into one customer", () => {
    const result = layout(
      [1, 2, 3, 4, 5].map((index) =>
        item({
          id: `p${index}`,
          customerId: null,
          customerName: "NO NAME",
          shippingCost: 10000,
        }),
      ),
    );
    expect(result.groups).toHaveLength(5);
    expect(result.groups.every((group) => group.rows.length === 1)).toBe(true);
    expect(result.groups.every((group) => group.rows[0].unitCost === null)).toBe(true);
  });

  it("sorts customers by name", () => {
    const result = layout([
      item({ id: "b", customerId: "cb", customerName: "BETA", shippingCost: 1000 }),
      item({ id: "a", customerId: "ca", customerName: "ALPHA", shippingCost: 1000 }),
      item({ id: "c", customerId: "cc", customerName: "CHARLIE", shippingCost: 1000 }),
    ]);
    expect(result.groups.map((group) => group.customerName)).toEqual([
      "ALPHA",
      "BETA",
      "CHARLIE",
    ]);
  });

  it("preserves input order inside a customer group", () => {
    const result = layout([
      item({ id: "p1", customerId: "c1", customerName: "A", trackingNumber: "FIRST", shippingCost: 1 }),
      item({ id: "p2", customerId: "c1", customerName: "A", trackingNumber: "SECOND", shippingCost: 2 }),
      item({ id: "p3", customerId: "c1", customerName: "A", trackingNumber: "THIRD", shippingCost: 3 }),
    ]);
    expect(result.rows.map((row) => row.item.trackingNumber)).toEqual([
      "FIRST",
      "SECOND",
      "THIRD",
    ]);
  });
});

describe("closing export mapper", () => {
  it("keeps dimensional weight string", () => {
    const data = prepareClosingExportData(
      { id: "c", code: "CLS", closing_date: "2026-08-17" },
      [
        {
          shipping_fee_snapshot_idr: "566464",
          chargeable_weight_snapshot_kg: 10,
          packages: {
            id: "p1",
            tracking_number: "JY1034242573",
            shipping_fee_idr: 566464,
            customer_id: "c1",
            charge_type: "VOLUMETRIC",
            length_cm: 53,
            width_cm: 64,
            height_cm: 117,
            customers: { id: "c1", name: "AA SILVIA SUBUR" },
          },
        },
      ],
    );
    expect(data.items[0].weightDisplay).toBe("53x64x117");
  });

  it("formats weight with Indonesian decimal", () => {
    const data = prepareClosingExportData(
      { id: "c", code: "CLS", closing_date: "2026-08-17" },
      [
        {
          shipping_fee_snapshot_idr: "4900",
          chargeable_weight_snapshot_kg: 0.49,
          packages: {
            id: "p1",
            tracking_number: "JY1034242572",
            shipping_fee_idr: 4900,
            customer_id: "c1",
            charge_type: "WEIGHT",
            length_cm: null,
            width_cm: null,
            height_cm: null,
            customers: { id: "c1", name: "AA SILVIA SUBUR" },
          },
        },
      ],
    );
    expect(data.items[0].weightDisplay).toBe("0,49");
  });

  it("maps missing customer to NO NAME", () => {
    const data = prepareClosingExportData(
      { id: "c", code: "CLS", closing_date: "2026-08-17" },
      [
        {
          shipping_fee_snapshot_idr: "10000",
          chargeable_weight_snapshot_kg: 1,
          packages: {
            id: "p1",
            tracking_number: "JY1130046511",
            shipping_fee_idr: 10000,
            customer_id: null,
            charge_type: "WEIGHT",
            length_cm: null,
            width_cm: null,
            height_cm: null,
            customers: null,
          },
        },
      ],
    );
    expect(data.items[0].customerName).toBe("NO NAME");
    expect(data.items[0].customerId).toBeNull();
  });

  it("falls back to live shipping fee when snapshot is missing", () => {
    const data = prepareClosingExportData(
      { id: "c", code: "CLS", closing_date: "2026-08-17" },
      [
        {
          shipping_fee_snapshot_idr: null,
          chargeable_weight_snapshot_kg: 1,
          packages: {
            id: "p1",
            tracking_number: "JY1034242572",
            shipping_fee_idr: 5000,
            customer_id: "c1",
            charge_type: "WEIGHT",
            length_cm: null,
            width_cm: null,
            height_cm: null,
            customers: { id: "c1", name: "CUSTOMER" },
          },
        },
      ],
    );
    expect(data.items[0].shippingCost).toBe(5000);
  });
});