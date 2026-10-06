# Karobar — Item-Wise Tax & Invoice Price Type (mobile prototype)

A working Expo / React Native prototype of two independent settings:

1. **Item-wise tax for inventory** — items carry their own tax rate and a With Tax / Without Tax price.
2. **Allow inclusive/exclusive tax for invoice** — each invoice can be Tax Included or Tax Extra.

No backend. Data is seeded and kept on the device with AsyncStorage.

## Run with Expo

```bash
npm install
npx expo start          # press i (iOS simulator), a (Android), or scan the QR code in Expo Go
npx expo start --web    # run in a browser
```

```bash
npm test                # calculation tests
npm run typecheck
npx expo lint
```

To start over, use **More → Settings → Reset demo data**. Both settings start OFF.

## Folder structure

```
src/
  app/                      Expo Router routes (screens only)
    _layout.tsx             fonts, storage hydration, toast host
    (tabs)/                 Home · Sales · Items · Parties · More
    settings/               index · tax-pricing · tax-rates
    items/                  new · [id] · [id]/edit
    sales/                  new · [id]
  components/               reusable UI (AppHeader, BottomSheet, ItemCard, InvoiceSummary, …)
  features/
    items/ItemForm.tsx      shared Add / Edit Item form (React Hook Form + Zod)
    sales/                  useSaleDraft, CustomerPickerSheet, SaleRow
  domain/                   no React in here
    types.ts                domain model
    calc.ts                 every pricing and tax formula
    calc.test.ts            tests for the formulas
    sale.ts                 draft → totals, draft → saved snapshot
    format.ts               formatMoney and labels
    seed.ts                 demo items, tax rates, parties, sales
  store/useAppStore.ts      Zustand store persisted to AsyncStorage
  theme/tokens.ts           colours, type, spacing from the Karobar Figma file
```

## Domain model

```ts
settings: { itemWiseTaxEnabled, invoiceInclusiveExclusiveEnabled, defaultInvoicePriceMode: 'included' | 'extra' }
taxRate:  { id, name, rate, kind: 'system' | 'custom' }
item:     { id, name, unit, salesPrice, salesPriceMode: 'with_tax' | 'without_tax', taxRateId, stock }
sale:     { id, number, date, partyName, invoicePriceMode, itemWiseTax, lines[], discountInput, totals, payment, notes }
saleLine: { name, quantity, unit, rate, discountInput, taxLabel, taxPercent, gross, discount, net, base, tax, total }
```

A sale is a **snapshot**. Tax name, tax percent, rate, discount, base, tax and total are copied into it when it is saved. The Sale screen reads only the snapshot, so changing settings, tax rates or items later never changes an old invoice.

## With Tax / Without Tax vs Tax Included / Tax Extra

They sound alike but describe different things.

| | Describes | Where | Stored on |
| --- | --- | --- | --- |
| **With Tax / Without Tax** | how a **saved item price** was entered | Add / Edit Item | the item |
| **Tax Included / Tax Extra** | how the **Rate field behaves on one invoice** | New Sale → "Prices: …" | the invoice |

An item saved as Rs. 1,130 **With Tax** at VAT 13% is worth Rs. 1,000 + Rs. 130.

| Invoice price type | Rate shown | Tax | Total |
| --- | --- | --- | --- |
| Tax Extra | Rs. 1,000 | Rs. 130 added | Rs. 1,130 |
| Tax Included | Rs. 1,130 | Rs. 130 inside the rate | Rs. 1,130 |

While editing an invoice line, **Rate entered as** (With Tax / Without Tax) lets the rate be typed either way; it is converted to the invoice's price type when applied and is not stored.

Adding an item to an invoice converts its saved price into the invoice's price type. Switching the invoice's price type converts the rates already on it. Neither ever changes the saved item.

## Calculation utilities (`src/domain/calc.ts`)

| Function | Does |
| --- | --- |
| `withTaxToBase(price, taxRate)` | base = price ÷ (1 + rate/100); tax = price − base |
| `withoutTaxToInclusive(price, taxRate)` | tax = price × rate/100; final = price + tax |
| `savedPriceBreakdown(price, mode, taxRate)` | base / tax / final for the item price preview |
| `convertSavedPriceToInvoiceRate({...})` | saved price + saved mode → rate for the invoice's price type |
| `convertRateBetweenModes(rate, taxRate, from, to)` | Tax Included ⇄ Tax Extra for one rate |
| `calculateDiscount(amount, discount)` | percentage or fixed, never more than the amount |
| `calculateInvoiceLine(line, mode, extraDiscount?)` | gross, discount, base, tax, total for one line |
| `calculateInvoiceTotals({ lines, discount, mode })` | all lines plus the invoice summary |
| `convertInvoicePriceMode({...})` | converts a whole draft when the price type changes |
| `calculatePayment(type, total, received)` | received and balance due |

Rules:

- **Tax Extra:** discounted base = rate × qty − discount; tax = base × rate%; total = base + tax.
- **Tax Included:** discounted amount = rate × qty − discount; base = amount ÷ (1 + rate%); tax = amount − base; total = amount.
- Discounts always apply **before tax**. An invoice-level discount is spread across lines in proportion to their amounts, then each line is taxed at its own rate.
- Changing a line's tax keeps its Rate. On Tax Extra the total changes; on Tax Included the total stays and base/tax are re-split.
- Rates keep full precision internally. Amounts are rounded to 2 decimals per line, and invoice totals are sums of those rounded lines, so the summary always adds up. `formatMoney()` is the only money formatter.

## Settings behaviour

| Item-wise tax | Inclusive/exclusive | Inventory | Invoice |
| --- | --- | --- | --- |
| OFF | OFF | no tax fields | Tax Extra, no Price Type control |
| ON | OFF | Tax Rate + With/Without Tax | per-item tax, always Tax Extra |
| OFF | ON | no tax fields | Price Type control available |
| ON | ON | Tax Rate + With/Without Tax | per-item tax + Price Type control |

- Turning item-wise tax **on** asks for confirmation and reveals **Manage Tax Rates**. Turning it off hides tax fields; items keep their saved tax setup for when it is turned back on.
- With inclusive/exclusive **on**, **Default Invoice Price Type** sets what new invoices start with. The invoice can still be changed from "Prices: …".
- Tax rates used by an item or a saved sale cannot be edited or deleted. System rates (Exempt, VAT 13%) are fixed.

### Decisions made where the brief was silent

- **Item-wise tax OFF:** an item's price is used as the invoice Rate as it is, and tax can be added once for the whole bill with **Add Tax**. This is what makes the "OFF + ON" row meaningful: Tax Included / Tax Extra then applies to the bill's tax.
- **Summary on Tax Included invoices** shows Subtotal − Discount = Total, with "Includes tax Rs. X" underneath, instead of adding a tax row on top of a tax-inclusive subtotal.
- **Dates** are shown in AD (for example "6 Oct 2026"). Bikram Sambat conversion is not implemented.
- **Stock** is reduced when a sale is saved and may go below zero.
- **Icons** are Lucide, not the Material icons from the Figma file.
