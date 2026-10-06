/** How a SAVED ITEM PRICE was entered. Shown as "With Tax" / "Without Tax". */
export type SavedPriceMode = 'with_tax' | 'without_tax';

/** How the RATE FIELD behaves on one invoice. Shown as "Tax Included" / "Tax Extra". */
export type InvoicePriceMode = 'included' | 'extra';

export type Settings = {
  itemWiseTaxEnabled: boolean;
  invoiceInclusiveExclusiveEnabled: boolean;
  defaultInvoicePriceMode: InvoicePriceMode;
};

export type TaxRate = {
  id: string;
  /** Optional label such as "VAT". Empty for plain percentage rates. */
  name: string;
  rate: number;
  kind: 'system' | 'custom';
};

export type Item = {
  id: string;
  name: string;
  unit: string;
  sku?: string;
  category?: string;
  salesPrice: number;
  salesPriceMode: SavedPriceMode;
  taxRateId: string;
  /** null when stock is not tracked (services). */
  stock: number | null;
};

export type Party = { id: string; name: string; phone?: string };

export type Discount = { type: 'percent' | 'fixed'; value: number };

export type PaymentType = 'cash' | 'credit' | 'partial';

/** A line on an invoice that is still being edited. */
export type DraftLine = {
  id: string;
  itemId: string;
  name: string;
  unit: string;
  quantity: number;
  /** Per-unit rate, expressed in the invoice's price mode. Kept at full precision. */
  rate: number;
  /** null = "No Tax". Only used when item-wise tax is on. */
  taxRateId: string | null;
  discount: Discount | null;
};

export type LineAmounts = {
  /** rate × quantity, in the invoice's price mode */
  gross: number;
  /** line discount, in the invoice's price mode */
  discount: number;
  /** gross − line discount (before any invoice-level discount) */
  net: number;
  /** taxable base after every discount */
  base: number;
  tax: number;
  total: number;
};

export type InvoiceTotals = {
  mode: InvoicePriceMode;
  itemAmount: number;
  lineDiscount: number;
  /** Σ net — tax-exclusive on Tax Extra invoices, tax-inclusive on Tax Included ones */
  subtotal: number;
  billDiscount: number;
  taxable: number;
  tax: number;
  total: number;
};

/** Frozen copy of a line. Never recalculated after saving. */
export type SaleLine = LineAmounts & {
  id: string;
  itemId: string;
  name: string;
  unit: string;
  quantity: number;
  rate: number;
  discountInput: Discount | null;
  /** null = no tax on this line */
  taxLabel: string | null;
  taxPercent: number;
  taxRateId: string | null;
};

export type Sale = {
  id: string;
  number: number;
  /** ISO date */
  date: string;
  partyId: string | null;
  partyName: string;
  invoicePriceMode: InvoicePriceMode;
  /** Whether tax was set per item (true) or once for the whole bill (false) when saved. */
  itemWiseTax: boolean;
  billTaxLabel: string | null;
  lines: SaleLine[];
  discountInput: Discount | null;
  totals: InvoiceTotals;
  payment: { type: PaymentType; received: number; due: number };
  notes: string;
};
