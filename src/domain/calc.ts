import type {
  Discount,
  InvoicePriceMode,
  InvoiceTotals,
  LineAmounts,
  SavedPriceMode,
} from './types';

/** Rounds to paisa. Only used on amounts that are shown or stored, never on rates. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const factor = (taxRate: number) => 1 + taxRate / 100;

/** A price that already contains tax → its base and tax parts. */
export function withTaxToBase(price: number, taxRate: number) {
  const base = price / factor(taxRate);
  return { base, tax: price - base };
}

/** A price without tax → the tax on top and the final price. */
export function withoutTaxToInclusive(price: number, taxRate: number) {
  const tax = (price * taxRate) / 100;
  return { tax, final: price + tax };
}

/** Base / tax / final for a saved item price, used by the item price preview. */
export function savedPriceBreakdown(price: number, mode: SavedPriceMode, taxRate: number) {
  if (mode === 'with_tax') {
    const { base, tax } = withTaxToBase(price, taxRate);
    return { base: round2(base), tax: round2(tax), final: round2(price) };
  }
  const { tax, final } = withoutTaxToInclusive(price, taxRate);
  return { base: round2(price), tax: round2(tax), final: round2(final) };
}

/** Moves a per-unit rate from one invoice price mode to the other. */
export function convertRateBetweenModes(
  rate: number,
  taxRate: number,
  from: InvoicePriceMode,
  to: InvoicePriceMode,
): number {
  if (from === to) return rate;
  return to === 'extra' ? rate / factor(taxRate) : rate * factor(taxRate);
}

/** The rate to show on an invoice for a saved item price. The saved item is never modified. */
export function convertSavedPriceToInvoiceRate(input: {
  price: number;
  savedMode: SavedPriceMode;
  taxRate: number;
  invoiceMode: InvoicePriceMode;
}): number {
  const from: InvoicePriceMode = input.savedMode === 'with_tax' ? 'included' : 'extra';
  return convertRateBetweenModes(input.price, input.taxRate, from, input.invoiceMode);
}

/** Discount amount on `amount`, never more than the amount itself. */
export function calculateDiscount(amount: number, discount: Discount | null): number {
  if (!discount || discount.value <= 0 || amount <= 0) return 0;
  const raw = discount.type === 'percent' ? (amount * discount.value) / 100 : discount.value;
  return Math.min(raw, amount);
}

export type LineInput = {
  quantity: number;
  rate: number;
  taxRate: number;
  discount: Discount | null;
};

/**
 * One invoice line. Discounts apply before tax.
 * Tax Extra: tax is added on the discounted amount.
 * Tax Included: tax is extracted from the discounted amount.
 * `extraDiscount` is this line's share of an invoice-level discount.
 */
export function calculateInvoiceLine(
  line: LineInput,
  mode: InvoicePriceMode,
  extraDiscount = 0,
): LineAmounts {
  const gross = line.rate * line.quantity;
  const discount = calculateDiscount(gross, line.discount);
  const net = gross - discount;
  const discounted = Math.max(net - extraDiscount, 0);

  if (mode === 'extra') {
    const base = round2(discounted);
    const tax = round2((discounted * line.taxRate) / 100);
    return { gross: round2(gross), discount: round2(discount), net: round2(net), base, tax, total: round2(base + tax) };
  }
  const total = round2(discounted);
  const tax = round2(discounted - discounted / factor(line.taxRate));
  return { gross: round2(gross), discount: round2(discount), net: round2(net), base: round2(total - tax), tax, total };
}

/** Each line's share of an invoice-level discount, proportional to its net amount. */
function allocateBillDiscount(lines: LineInput[], discount: Discount | null): number[] {
  const nets = lines.map((l) => {
    const gross = l.rate * l.quantity;
    return gross - calculateDiscount(gross, l.discount);
  });
  const sum = nets.reduce((a, b) => a + b, 0);
  const amount = calculateDiscount(sum, discount);
  return nets.map((net) => (sum > 0 ? (amount * net) / sum : 0));
}

export function calculateInvoiceTotals(input: {
  lines: LineInput[];
  discount: Discount | null;
  mode: InvoicePriceMode;
}): { lines: LineAmounts[]; totals: InvoiceTotals } {
  const shares = allocateBillDiscount(input.lines, input.discount);
  const lines = input.lines.map((line, i) => calculateInvoiceLine(line, input.mode, shares[i]));
  const sum = (pick: (l: LineAmounts) => number) => round2(lines.reduce((a, l) => a + pick(l), 0));

  const subtotal = sum((l) => l.net);
  const taxable = sum((l) => l.base);
  const tax = sum((l) => l.tax);
  const total = sum((l) => l.total);
  return {
    lines,
    totals: {
      mode: input.mode,
      itemAmount: sum((l) => l.gross),
      lineDiscount: sum((l) => l.discount),
      subtotal,
      // Derived from the rounded lines so the summary always adds up exactly.
      billDiscount: round2(subtotal - (input.mode === 'extra' ? taxable : total)),
      taxable,
      tax,
      total,
    },
  };
}

/**
 * Converts a whole draft when the user switches Tax Included ⇄ Tax Extra.
 * Rates and fixed discounts are converted so every line total stays the same.
 */
export function convertInvoicePriceMode<T extends LineInput>(input: {
  lines: T[];
  discount: Discount | null;
  from: InvoicePriceMode;
  to: InvoicePriceMode;
}): { lines: T[]; discount: Discount | null } {
  const { from, to } = input;
  if (from === to) return { lines: input.lines, discount: input.discount };

  const convert = (value: number, taxRate: number) => convertRateBetweenModes(value, taxRate, from, to);
  const lines = input.lines.map((line) => ({
    ...line,
    rate: convert(line.rate, line.taxRate),
    discount:
      line.discount?.type === 'fixed'
        ? { ...line.discount, value: round2(convert(line.discount.value, line.taxRate)) }
        : line.discount,
  }));

  let discount = input.discount;
  if (discount?.type === 'fixed') {
    const shares = allocateBillDiscount(input.lines, discount);
    const value = shares.reduce((a, share, i) => a + convert(share, input.lines[i].taxRate), 0);
    discount = { type: 'fixed', value: round2(value) };
  }
  return { lines, discount };
}

export function calculatePayment(type: 'cash' | 'credit' | 'partial', total: number, partialReceived = 0) {
  const received = type === 'cash' ? total : type === 'credit' ? 0 : Math.min(Math.max(partialReceived, 0), total);
  return { received: round2(received), due: round2(total - received) };
}
