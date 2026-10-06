import { useCallback, useMemo, useState } from 'react';

import { convertInvoicePriceMode, convertSavedPriceToInvoiceRate } from '@/domain/calc';
import { calculateDraft, resolveLineTax, type SaleDraft, type TaxContext } from '@/domain/sale';
import type { DraftLine, InvoicePriceMode, Item, Settings } from '@/domain/types';
import { newId } from '@/store/useAppStore';

/** Tax Extra is the product default whenever the per-invoice choice is switched off. */
export function initialPriceMode(settings: Settings): InvoicePriceMode {
  return settings.invoiceInclusiveExclusiveEnabled ? settings.defaultInvoicePriceMode : 'extra';
}

const emptyDraft = (settings: Settings): SaleDraft => ({
  partyId: null,
  priceMode: initialPriceMode(settings),
  lines: [],
  discount: null,
  billTaxRateId: null,
  paymentType: 'cash',
  received: 0,
  notes: '',
});

export function useSaleDraft(settings: Settings, ctx: TaxContext) {
  const [draft, setDraft] = useState<SaleDraft>(() => emptyDraft(settings));
  const patch = useCallback((changes: Partial<SaleDraft>) => setDraft((d) => ({ ...d, ...changes })), []);

  /** Adds an item using its saved price, price mode and tax. The saved item is never changed. */
  const addItem = useCallback(
    (item: Item) =>
      setDraft((d) => {
        const existing = d.lines.find((l) => l.itemId === item.id);
        if (existing) {
          return { ...d, lines: d.lines.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l)) };
        }
        const taxRate = ctx.taxRates.find((r) => r.id === item.taxRateId)?.rate ?? 0;
        const line: DraftLine = {
          id: newId(),
          itemId: item.id,
          name: item.name,
          unit: item.unit,
          quantity: 1,
          taxRateId: item.taxRateId,
          discount: null,
          // With item-wise tax off the item has no tax setup, so its price is used as the rate as is.
          rate: ctx.itemWiseTax
            ? convertSavedPriceToInvoiceRate({ price: item.salesPrice, savedMode: item.salesPriceMode, taxRate, invoiceMode: d.priceMode })
            : item.salesPrice,
        };
        return { ...d, lines: [...d.lines, line] };
      }),
    [ctx],
  );

  const updateLine = useCallback(
    (line: DraftLine) => setDraft((d) => ({ ...d, lines: d.lines.map((l) => (l.id === line.id ? line : l)) })),
    [],
  );

  const removeLine = useCallback((id: string) => setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.id !== id) })), []);

  const restoreLine = useCallback(
    (line: DraftLine, index: number) =>
      setDraft((d) => ({ ...d, lines: [...d.lines.slice(0, index), line, ...d.lines.slice(index)] })),
    [],
  );

  /** Switches Tax Included ⇄ Tax Extra and converts existing rates so totals do not move. */
  const setPriceMode = useCallback(
    (to: InvoicePriceMode) =>
      setDraft((d) => {
        const withTax = d.lines.map((line) => ({ ...line, taxRate: resolveLineTax(d, line, ctx)?.rate ?? 0 }));
        const converted = convertInvoicePriceMode({ lines: withTax, discount: d.discount, from: d.priceMode, to });
        return {
          ...d,
          priceMode: to,
          discount: converted.discount,
          lines: converted.lines.map(({ taxRate: _taxRate, ...line }) => line),
        };
      }),
    [ctx],
  );

  const reset = useCallback(() => setDraft(emptyDraft(settings)), [settings]);
  const calculated = useMemo(() => calculateDraft(draft, ctx), [draft, ctx]);

  return { draft, patch, addItem, updateLine, removeLine, restoreLine, setPriceMode, reset, ...calculated };
}
