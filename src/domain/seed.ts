import { convertSavedPriceToInvoiceRate } from './calc';
import { buildSale, type SaleDraft } from './sale';
import type { InvoicePriceMode, Item, Party, Sale, Settings, TaxRate } from './types';

export const UNITS = ['Pc', 'Kg', 'Bottle', 'Box', 'Packet', 'Litre', 'Service'];

export const seedSettings: Settings = {
  itemWiseTaxEnabled: false,
  invoiceInclusiveExclusiveEnabled: false,
  defaultInvoicePriceMode: 'extra',
};

export const seedTaxRates: TaxRate[] = [
  { id: 'exempt', name: 'Exempt', rate: 0, kind: 'system' },
  { id: 'vat13', name: 'VAT', rate: 13, kind: 'system' },
  { id: 'tax5', name: '', rate: 5, kind: 'custom' },
  { id: 'tax7_5', name: '', rate: 7.5, kind: 'custom' },
  { id: 'tax18', name: '', rate: 18, kind: 'custom' },
];

export const seedItems: Item[] = [
  { id: 'macbook', name: 'MacBook Air', unit: 'Pc', salesPrice: 113000, salesPriceMode: 'with_tax', taxRateId: 'vat13', stock: 5, category: 'Electronics' },
  { id: 'rice', name: 'Rice', unit: 'Kg', salesPrice: 500, salesPriceMode: 'without_tax', taxRateId: 'exempt', stock: 100, category: 'Grocery' },
  { id: 'oil', name: 'Cooking Oil', unit: 'Bottle', salesPrice: 500, salesPriceMode: 'without_tax', taxRateId: 'vat13', stock: 40, category: 'Grocery' },
  { id: 'consulting', name: 'Consulting Service', unit: 'Service', salesPrice: 10000, salesPriceMode: 'without_tax', taxRateId: 'tax5', stock: null },
];

export const seedParties: Party[] = [
  { id: 'abc', name: 'ABC Traders', phone: '9801234567' },
  { id: 'sharma', name: 'Sharma Kirana Pasal', phone: '9812345678' },
  { id: 'himal', name: 'Himal Stores', phone: '9845678901' },
];

function seedSale(
  number: number,
  daysAgo: number,
  partyId: string | null,
  priceMode: InvoicePriceMode,
  entries: [itemId: string, quantity: number][],
  paymentType: SaleDraft['paymentType'],
  received = 0,
): Sale {
  const draft: SaleDraft = {
    partyId,
    priceMode,
    discount: null,
    billTaxRateId: null,
    paymentType,
    received,
    notes: '',
    lines: entries.map(([itemId, quantity], index) => {
      const item = seedItems.find((i) => i.id === itemId)!;
      const tax = seedTaxRates.find((t) => t.id === item.taxRateId)!;
      return {
        id: `seed-${number}-${index}`,
        itemId,
        name: item.name,
        unit: item.unit,
        quantity,
        taxRateId: tax.id,
        discount: null,
        rate: convertSavedPriceToInvoiceRate({
          price: item.salesPrice,
          savedMode: item.salesPriceMode,
          taxRate: tax.rate,
          invoiceMode: priceMode,
        }),
      };
    }),
  };
  const date = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
  const partyName = seedParties.find((p) => p.id === partyId)?.name ?? 'Cash Sale';
  return buildSale(draft, { itemWiseTax: true, taxRates: seedTaxRates }, { id: `sale-${number}`, number, date, partyName });
}

/** Saved while item-wise tax was on, so they show how old invoices keep their own tax and price type. */
export const seedSales: Sale[] = [
  seedSale(4, 1, 'abc', 'included', [['macbook', 1]], 'partial', 50000),
  seedSale(3, 2, 'sharma', 'extra', [['rice', 2], ['oil', 1], ['consulting', 1]], 'credit'),
  seedSale(2, 4, null, 'extra', [['oil', 6]], 'cash'),
  seedSale(1, 6, 'himal', 'included', [['rice', 10], ['oil', 2]], 'cash'),
];
