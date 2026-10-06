import { calculateInvoiceTotals, calculatePayment } from './calc';
import { taxLabel } from './format';
import type { Discount, DraftLine, InvoicePriceMode, PaymentType, Sale, TaxRate } from './types';

export type SaleDraft = {
  partyId: string | null;
  priceMode: InvoicePriceMode;
  lines: DraftLine[];
  discount: Discount | null;
  /** Tax for the whole bill. Only used when item-wise tax is off. */
  billTaxRateId: string | null;
  paymentType: PaymentType;
  received: number;
  notes: string;
};

export type TaxContext = { itemWiseTax: boolean; taxRates: TaxRate[] };

/** The tax that applies to a draft line: its own when item-wise tax is on, otherwise the bill's. */
export function resolveLineTax(draft: SaleDraft, line: DraftLine, ctx: TaxContext): TaxRate | null {
  const id = ctx.itemWiseTax ? line.taxRateId : draft.billTaxRateId;
  return ctx.taxRates.find((rate) => rate.id === id) ?? null;
}

export function calculateDraft(draft: SaleDraft, ctx: TaxContext) {
  const taxes = draft.lines.map((line) => resolveLineTax(draft, line, ctx));
  const result = calculateInvoiceTotals({
    mode: draft.priceMode,
    discount: draft.discount,
    lines: draft.lines.map((line, i) => ({
      quantity: line.quantity,
      rate: line.rate,
      taxRate: taxes[i]?.rate ?? 0,
      discount: line.discount,
    })),
  });
  return { ...result, taxes };
}

/** Freezes a draft into a sale. Everything needed to display it later is copied in. */
export function buildSale(
  draft: SaleDraft,
  ctx: TaxContext,
  meta: { id: string; number: number; date: string; partyName: string },
): Sale {
  const { lines, totals, taxes } = calculateDraft(draft, ctx);
  const billTax = ctx.itemWiseTax ? null : (ctx.taxRates.find((r) => r.id === draft.billTaxRateId) ?? null);
  return {
    ...meta,
    partyId: draft.partyId,
    invoicePriceMode: draft.priceMode,
    itemWiseTax: ctx.itemWiseTax,
    billTaxLabel: billTax ? taxLabel(billTax) : null,
    lines: draft.lines.map((line, i) => ({
      ...lines[i],
      id: line.id,
      itemId: line.itemId,
      name: line.name,
      unit: line.unit,
      quantity: line.quantity,
      rate: line.rate,
      discountInput: line.discount,
      taxRateId: taxes[i]?.id ?? null,
      taxLabel: taxes[i] ? taxLabel(taxes[i]!) : null,
      taxPercent: taxes[i]?.rate ?? 0,
    })),
    discountInput: draft.discount,
    totals,
    payment: { type: draft.paymentType, ...calculatePayment(draft.paymentType, totals.total, draft.received) },
    notes: draft.notes,
  };
}
