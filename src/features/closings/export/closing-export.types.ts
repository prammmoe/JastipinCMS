export type ClosingExportItem = {
  id: string;
  customerId: string | null;
  customerName: string;
  trackingNumber: string;
  weightDisplay: string;
  shippingCost: number;
};

export type ClosingExportData = {
  id: string;
  code: string;
  closingDate: string;
  items: ClosingExportItem[];
};