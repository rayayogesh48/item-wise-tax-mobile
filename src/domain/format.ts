import type { Discount, InvoicePriceMode, SavedPriceMode, TaxRate } from './types';

function group(integer: string): string {
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * The single money formatter. "Rs. 1,130.00" by default;
 * `compact` drops ".00" on whole amounts for cards and lists.
 */
export function formatMoney(value: number, options: { compact?: boolean; symbol?: boolean } = {}): string {
  const { compact = false, symbol = true } = options;
  const safe = Number.isFinite(value) ? value : 0;
  const [integer, decimals] = Math.abs(safe).toFixed(2).split('.');
  const body = compact && decimals === '00' ? group(integer) : `${group(integer)}.${decimals}`;
  return `${safe < 0 ? '−' : ''}${symbol ? 'Rs. ' : ''}${body}`;
}

/** Plain number for a text input: at most 2 decimals, no trailing zeros. */
export function formatNumberInput(value: number): string {
  return Number.isFinite(value) ? String(Math.round((value + Number.EPSILON) * 100) / 100) : '';
}

export function parseNumber(text: string): number {
  const value = Number.parseFloat(text.replace(/,/g, ''));
  return Number.isFinite(value) ? value : 0;
}

export function formatQuantity(quantity: number): string {
  return String(Math.round(quantity * 1000) / 1000);
}

/** "Exempt", "VAT 13%", "5%" */
export function taxLabel(rate: Pick<TaxRate, 'name' | 'rate'>): string {
  if (rate.rate === 0) return rate.name || 'Exempt';
  return rate.name ? `${rate.name} ${rate.rate}%` : `${rate.rate}%`;
}

export const savedPriceModeLabel: Record<SavedPriceMode, string> = {
  with_tax: 'With Tax',
  without_tax: 'Without Tax',
};

export const invoicePriceModeLabel: Record<InvoicePriceMode, string> = {
  included: 'Tax Included',
  extra: 'Tax Extra',
};

export function discountLabel(discount: Discount | null): string {
  if (!discount || discount.value <= 0) return 'None';
  return discount.type === 'percent' ? `${discount.value}%` : formatMoney(discount.value, { compact: true });
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function invoiceNumber(number: number): string {
  return `#${String(number).padStart(4, '0')}`;
}
