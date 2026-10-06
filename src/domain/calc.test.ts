import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  calculateDiscount,
  calculateInvoiceLine,
  calculateInvoiceTotals,
  calculatePayment,
  convertInvoicePriceMode,
  convertSavedPriceToInvoiceRate,
  savedPriceBreakdown,
  withTaxToBase,
  withoutTaxToInclusive,
} from './calc';

const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} ≠ ${expected}`);

test('with tax / without tax helpers', () => {
  const a = withTaxToBase(1130, 13);
  near(a.base, 1000);
  near(a.tax, 130);
  assert.deepEqual(withoutTaxToInclusive(1000, 13), { tax: 130, final: 1130 });
  assert.deepEqual(savedPriceBreakdown(1130, 'with_tax', 13), { base: 1000, tax: 130, final: 1130 });
  assert.deepEqual(savedPriceBreakdown(1000, 'without_tax', 13), { base: 1000, tax: 130, final: 1130 });
});

test('saved price → invoice rate, all four combinations', () => {
  const rate = (savedMode: 'with_tax' | 'without_tax', invoiceMode: 'included' | 'extra', price: number) =>
    convertSavedPriceToInvoiceRate({ price, savedMode, taxRate: 13, invoiceMode });
  near(rate('with_tax', 'extra', 1130), 1000);
  near(rate('with_tax', 'included', 1130), 1130);
  near(rate('without_tax', 'extra', 1000), 1000);
  near(rate('without_tax', 'included', 1000), 1130);
});

test('With Tax item on both invoice price types', () => {
  const rate = convertSavedPriceToInvoiceRate({ price: 1130, savedMode: 'with_tax', taxRate: 13, invoiceMode: 'extra' });
  const extra = calculateInvoiceLine({ quantity: 1, rate, taxRate: 13, discount: null }, 'extra');
  assert.deepEqual([extra.base, extra.tax, extra.total], [1000, 130, 1130]);
  const included = calculateInvoiceLine({ quantity: 1, rate: 1130, taxRate: 13, discount: null }, 'included');
  assert.deepEqual([included.base, included.tax, included.total], [1000, 130, 1130]);
});

test('changing the tax rate keeps the Rate and behaves per price type', () => {
  const extra = calculateInvoiceLine({ quantity: 1, rate: 100, taxRate: 5, discount: null }, 'extra');
  assert.deepEqual([extra.tax, extra.total], [5, 105]);
  const included = calculateInvoiceLine({ quantity: 1, rate: 113, taxRate: 5, discount: null }, 'included');
  assert.deepEqual([included.base, included.tax, included.total], [107.62, 5.38, 113]);
});

test('discount applies before tax', () => {
  const discount = { type: 'percent', value: 10 } as const;
  const extra = calculateInvoiceLine({ quantity: 1, rate: 1000, taxRate: 13, discount }, 'extra');
  assert.deepEqual([extra.base, extra.tax, extra.total], [900, 117, 1017]);
  const included = calculateInvoiceLine({ quantity: 1, rate: 1130, taxRate: 13, discount }, 'included');
  assert.deepEqual([included.base, included.tax, included.total], [900, 117, 1017]);
  assert.equal(calculateDiscount(100, { type: 'fixed', value: 500 }), 100);
});

test('mixed tax invoice calculates every line independently', () => {
  const { lines, totals } = calculateInvoiceTotals({
    mode: 'extra',
    discount: null,
    lines: [
      { quantity: 2, rate: 500, taxRate: 0, discount: null },
      { quantity: 1, rate: 500, taxRate: 13, discount: null },
      { quantity: 1, rate: 10000, taxRate: 5, discount: null },
    ],
  });
  assert.deepEqual(lines.map((l) => l.tax), [0, 65, 500]);
  assert.deepEqual([totals.subtotal, totals.tax, totals.total], [11500, 565, 12065]);
});

test('invoice discount is spread before tax and the summary adds up', () => {
  const { totals } = calculateInvoiceTotals({
    mode: 'extra',
    discount: { type: 'fixed', value: 1000 },
    lines: [
      { quantity: 1, rate: 100000, taxRate: 13, discount: null },
      { quantity: 2, rate: 500, taxRate: 0, discount: null },
    ],
  });
  assert.equal(totals.subtotal, 101000);
  assert.equal(totals.billDiscount, 1000);
  near(totals.subtotal - totals.billDiscount + totals.tax, totals.total);
});

test('switching price type converts rates and keeps totals', () => {
  const lines = [
    { quantity: 1, rate: 1130, taxRate: 13, discount: { type: 'fixed', value: 113 } as const },
    { quantity: 2, rate: 500, taxRate: 0, discount: null },
  ];
  const discount = { type: 'fixed', value: 100 } as const;
  const before = calculateInvoiceTotals({ lines, discount, mode: 'included' }).totals;
  const converted = convertInvoicePriceMode({ lines, discount, from: 'included', to: 'extra' });
  near(converted.lines[0].rate, 1000);
  assert.equal(converted.lines[0].discount?.value, 100);
  assert.equal(converted.lines[1].rate, 500);
  const after = calculateInvoiceTotals({ ...converted, mode: 'extra' }).totals;
  assert.ok(Math.abs(after.total - before.total) <= 0.02);
  const back = convertInvoicePriceMode({ ...converted, from: 'extra', to: 'included' });
  near(back.lines[0].rate, 1130);
});

test('payment types', () => {
  assert.deepEqual(calculatePayment('cash', 1130), { received: 1130, due: 0 });
  assert.deepEqual(calculatePayment('credit', 1130), { received: 0, due: 1130 });
  assert.deepEqual(calculatePayment('partial', 1130, 500), { received: 500, due: 630 });
});
