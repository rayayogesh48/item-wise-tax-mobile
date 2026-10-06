# Item-Wise Tax & Invoice Price Type — Logic and Functionality

Platform-neutral specification of everything the mobile prototype (`karobar-mobile`) does.
Use it to build the web version: the logic and behaviour are identical, only the UI differs.

**Reusable as-is.** `karobar-mobile/src/domain/` has no React or React Native in it. Copy
`types.ts`, `calc.ts`, `calc.test.ts`, `sale.ts`, `format.ts` and `seed.ts` into the web project unchanged.
`src/store/useAppStore.ts` (Zustand) also works on web if you swap AsyncStorage for `localStorage`.

---

## 1. The two settings

| Setting | Key | Default | Controls |
| --- | --- | --- | --- |
| Item-wise tax for inventory | `itemWiseTaxEnabled` | `false` | Whether each item has its own tax rate and a With Tax / Without Tax price, and whether invoice lines are taxed individually |
| Allow inclusive/exclusive tax for invoice | `invoiceInclusiveExclusiveEnabled` | `false` | Whether the user can choose Tax Included / Tax Extra on each invoice |
| Default Invoice Price Type | `defaultInvoicePriceMode` | `'extra'` | Starting price type of a new invoice. Only used while the second setting is on |

The two settings are independent. All four combinations must work.

| Item-wise tax | Inclusive/exclusive | Inventory screens | New invoice |
| --- | --- | --- | --- |
| OFF | OFF | No tax fields | No Price Type control. Tax Extra. Optional bill-level tax |
| ON | OFF | Tax Rate + With/Without Tax | Per-line tax. No Price Type control. Always Tax Extra |
| OFF | ON | No tax fields | Price Type control. Optional bill-level tax |
| ON | ON | Tax Rate + With/Without Tax | Per-line tax + Price Type control |

### Behaviour

- Turning **item-wise tax ON** requires confirmation: title "Enable item-wise tax?", body "You'll be able to assign tax rates and With Tax / Without Tax pricing to inventory items.", actions Cancel / Enable. Turning it OFF is immediate.
- While item-wise tax is ON, show a "Manage Tax Rates" entry (supporting text: the list of rate labels). Hide it when OFF.
- While inclusive/exclusive is ON, show "Default Invoice Price Type" with options Tax Included / Tax Extra. Helper: "Used automatically when creating a new invoice. You can still change it on the invoice." Hide it when OFF.
- Turning item-wise tax OFF does **not** delete an item's saved tax rate or price mode. They are hidden and ignored, and come back when it is turned ON again.
- No setting change ever alters a saved invoice.

---

## 2. Terminology (use exactly)

| Context | Terms | Meaning |
| --- | --- | --- |
| Inventory | **With Tax** / **Without Tax** | How a saved item price was entered |
| Invoice | **Tax Included** / **Tax Extra** | How the Rate field behaves on this invoice |
| Tax | **VAT 13%**, **5%**, **18%**, **Exempt** | Tax rate labels |

Never show "Inclusive", "Exclusive" or "Taxable Base" as primary wording (the settings row title is the one exception, as specified). Show "Exempt" rather than "0% Tax".

---

## 3. Data model

```ts
type SavedPriceMode   = 'with_tax' | 'without_tax';   // inventory
type InvoicePriceMode = 'included' | 'extra';         // invoice

type Settings = {
  itemWiseTaxEnabled: boolean;
  invoiceInclusiveExclusiveEnabled: boolean;
  defaultInvoicePriceMode: InvoicePriceMode;
};

type TaxRate = { id: string; name: string; rate: number; kind: 'system' | 'custom' };

type Item = {
  id: string; name: string; unit: string; sku?: string; category?: string;
  salesPrice: number;              // stored exactly as typed
  salesPriceMode: SavedPriceMode;
  taxRateId: string;
  stock: number | null;            // null = stock not tracked (unit "Service")
};

type Party = { id: string; name: string; phone?: string };

type Discount = { type: 'percent' | 'fixed'; value: number };

type DraftLine = {
  id: string; itemId: string; name: string; unit: string;
  quantity: number;
  rate: number;                    // per unit, in the invoice's price mode, FULL precision
  taxRateId: string | null;        // null = "No Tax"; only used when item-wise tax is on
  discount: Discount | null;
};

type SaleDraft = {
  partyId: string | null;          // null = Cash Sale
  priceMode: InvoicePriceMode;
  lines: DraftLine[];
  discount: Discount | null;       // invoice-level
  billTaxRateId: string | null;    // whole-bill tax; only used when item-wise tax is off
  paymentType: 'cash' | 'credit' | 'partial';
  received: number;                // only meaningful for 'partial'
  notes: string;
};

type LineAmounts = { gross; discount; net; base; tax; total };   // all numbers, rounded to 2 dp

type InvoiceTotals = {
  mode: InvoicePriceMode;
  itemAmount;    // Σ gross
  lineDiscount;  // Σ line discounts
  subtotal;      // Σ net  (tax-exclusive on Tax Extra, tax-inclusive on Tax Included)
  billDiscount;  // invoice-level discount actually applied
  taxable;       // Σ base
  tax;           // Σ tax
  total;         // Σ line totals
};

type SaleLine = LineAmounts & {
  id; itemId; name; unit; quantity; rate;
  discountInput: Discount | null;
  taxRateId: string | null; taxLabel: string | null; taxPercent: number;
};

type Sale = {
  id; number; date /* ISO */; partyId; partyName;
  invoicePriceMode: InvoicePriceMode;
  itemWiseTax: boolean;            // how tax was applied when saved
  billTaxLabel: string | null;
  lines: SaleLine[];
  discountInput: Discount | null;
  totals: InvoiceTotals;
  payment: { type; received; due };
  notes: string;
};
```

### Seed data

**Tax rates:** `exempt` Exempt 0% (system) · `vat13` VAT 13% (system) · `tax5` 5% · `tax7_5` 7.5% · `tax18` 18% (custom).

**Items:**

| Name | Price | Mode | Tax | Unit | Stock |
| --- | --- | --- | --- | --- | --- |
| MacBook Air | 113,000 | With Tax | VAT 13% | Pc | 5 |
| Rice | 500 | Without Tax | Exempt | Kg | 100 |
| Cooking Oil | 500 | Without Tax | VAT 13% | Bottle | 40 |
| Consulting Service | 10,000 | Without Tax | 5% | Service | not tracked |

**Parties:** ABC Traders, Sharma Kirana Pasal, Himal Stores.

**Sales** (built with item-wise tax on, so they demonstrate history):

| # | Party | Price type | Lines | Payment |
| --- | --- | --- | --- | --- |
| 4 | ABC Traders | Tax Included | MacBook Air ×1 | Partial, 50,000 received |
| 3 | Sharma Kirana Pasal | Tax Extra | Rice ×2, Cooking Oil ×1, Consulting ×1 (mixed tax) | Credit |
| 2 | Cash Sale | Tax Extra | Cooking Oil ×6 | Cash |
| 1 | Himal Stores | Tax Included | Rice ×10, Cooking Oil ×2 | Cash |

**Units:** Pc, Kg, Bottle, Box, Packet, Litre, Service.

---

## 4. Tax rates

- **Label rule** (`taxLabel`): rate 0 → name or "Exempt"; has a name → `"{name} {rate}%"` (e.g. "VAT 13%"); otherwise `"{rate}%"`.
- **Add:** Rate (%) required, must be > 0 and ≤ 100. Label optional, max 20 characters. Reject if the resulting label already exists ("5% already exists.").
- **System rates** (Exempt, VAT 13%) cannot be edited or deleted.
- **A rate is "used"** when any item has that `taxRateId` or any saved sale line has that `taxRateId`.
- **Used custom rate:** cannot be edited or deleted. Show "Used tax rate" with a disabled delete action.
- **Unused custom rate:** can be edited and deleted.
- List row shows: name (or the percentage), rate, status: "System", "Custom", or "Custom · In use".

---

## 5. Items

### Add / Edit Item

| Field | Rule |
| --- | --- |
| Item Name | Required |
| Unit | From the unit list. Default "Pc" |
| SKU, Category | Optional |
| Sales Price | Required, must be > 0. Stored exactly as typed |
| Price entered as | With Tax / Without Tax. **Only when item-wise tax is ON.** Default Without Tax |
| Tax Rate | Pick from tax rates. **Only when item-wise tax is ON.** New item default: VAT 13% when ON, Exempt when OFF |
| Stock | Number. Hidden when unit is "Service" (stock saved as `null`) |

- When item-wise tax is OFF, the price-mode control, tax rate and price breakdown are **removed**, not disabled.
- Editing an existing item while OFF keeps its stored price mode and tax rate untouched.
- Changing With Tax ⇄ Without Tax never changes the number; it changes what the number means.
- Helper text: With Tax → "Entered price already includes tax." Without Tax → "Tax will be added to the entered price."

### Price Breakdown preview (item-wise tax ON, price > 0)

```
With Tax:     base = price / (1 + rate/100);  tax = price − base;       final = price
Without Tax:  base = price;                   tax = price × rate/100;   final = price + tax
```

Both "1,130 With Tax 13%" and "1,000 Without Tax 13%" preview as Base 1,000 · Tax 130 · Final 1,130. Updates live when price, mode or rate changes. It is information, not a form.

### Item list and item detail

- Row shows name, sales price, and stock ("Stock: 5 Pc") when tracked.
- Tax metadata is shown **only when item-wise tax is ON**: `"{With Tax|Without Tax} · {tax label}"`, or just `"Exempt"` for a 0% rate.
- Search filters by name (case-insensitive substring).
- Detail shows Sales Price (with the price mode as small secondary text), Tax Rate, Unit, Stock and the breakdown. Tax parts only when item-wise tax is ON.

---

## 6. New Sale (invoice draft)

### Starting state

- `priceMode` = `defaultInvoicePriceMode` if inclusive/exclusive is ON, otherwise `'extra'`.
- Invoice number = highest existing sale number + 1, shown as `#0005`.
- Date = today. Customer = none ("Cash Sale"). Payment = Cash. No lines, no discount, no bill tax.
- If inclusive/exclusive is switched OFF while a draft is open, the draft converts itself to Tax Extra.

### Price Type control

Shown only when inclusive/exclusive is ON, next to the Items heading ("Prices: Tax Extra").
It opens a chooser: "How are prices entered?" with **Tax Included** ("Rate already includes tax.") and **Tax Extra** ("Tax is added to Rate."), then Apply.

On Apply:
1. Same as current → nothing happens.
2. Invoice has no lines → switch immediately.
3. Invoice has lines → confirm first: "Change price type?" / "Existing item rates will be converted automatically." showing Current and Change to, with Cancel / Change.

### Adding an item

The picker searches by name and lists "Recently Used" first (unique item ids from saved sales, newest first), then the rest. Selecting an item adds it immediately; it never asks for a tax mode. The picker can stay open to add several items and shows how many of each are on the invoice.

1. If the item is already on the invoice → its quantity +1.
2. Otherwise add a line with quantity 1, the item's unit and `taxRateId`, no discount, and a rate:
   - **Item-wise tax ON:** `rate = convertSavedPriceToInvoiceRate(price, savedMode, taxRate, invoiceMode)`
   - **Item-wise tax OFF:** `rate = salesPrice` (the item has no tax setup, so the price is used as it is)

The saved item is never modified.

| Saved item | Invoice price type | Rate shown |
| --- | --- | --- |
| 1,130 With Tax 13% | Tax Extra | 1,000 |
| 1,130 With Tax 13% | Tax Included | 1,130 |
| 1,000 Without Tax 13% | Tax Extra | 1,000 |
| 1,000 Without Tax 13% | Tax Included | 1,130 |

```
from = savedMode == 'with_tax' ? 'included' : 'extra'
included → extra:  rate / (1 + t/100)
extra → included:  rate × (1 + t/100)
same mode:         unchanged
```

### Which tax applies to a line

```
item-wise tax ON  → the line's own taxRateId (null = No Tax)
item-wise tax OFF → the draft's billTaxRateId (null = no tax), same for every line
```

### Bill-level tax (item-wise tax OFF only)

An "Add Tax" action picks one tax rate (or No Tax) for the whole bill. Once set it reads "Tax: VAT 13%". It is hidden when item-wise tax is ON, so tax can never be applied twice. Lines do not show tax details in this case; the summary row reads "Tax (VAT 13%)".

---

## 7. Calculations

`round2(x) = Math.round((x + Number.EPSILON) × 100) / 100`. Rates are **never** rounded; only displayed or stored amounts are.

### Discount

```
calculateDiscount(amount, discount):
  none, value ≤ 0 or amount ≤ 0 → 0
  percent → amount × value / 100
  fixed   → value
  result is capped at `amount`
```

Discounts always apply **before tax**.

### One line

```
gross      = rate × quantity
discount   = calculateDiscount(gross, line.discount)
net        = gross − discount
discounted = max(net − shareOfInvoiceDiscount, 0)

Tax Extra:
  base  = round2(discounted)
  tax   = round2(discounted × t / 100)
  total = round2(base + tax)

Tax Included:
  total = round2(discounted)
  tax   = round2(discounted − discounted / (1 + t/100))
  base  = round2(total − tax)

gross, discount, net are also returned rounded to 2 dp.
```

### Invoice-level discount

Spread across lines in proportion to each line's (unrounded) net, then each line is taxed at its own rate:

```
sum     = Σ net
amount  = calculateDiscount(sum, invoiceDiscount)
share_i = amount × net_i / sum          (0 if sum is 0)
```

### Totals

```
itemAmount   = Σ gross
lineDiscount = Σ line discount
subtotal     = Σ net
taxable      = Σ base
tax          = Σ tax
total        = Σ line total
billDiscount = Tax Extra:    subtotal − taxable
               Tax Included: subtotal − total
```

Totals are sums of the already-rounded lines, and `billDiscount` is derived, so the summary always adds up exactly.

### Changing the invoice price type (with lines present)

For each line, using that line's effective tax rate `t`:

```
rate           → converted (÷ or × (1 + t/100)), not rounded
fixed discount → converted the same way, then round2
% discount     → unchanged
```

Invoice-level discount: percentage unchanged; a fixed amount becomes `round2(Σ convert(share_i, t_i))`.

Result: every line total and the invoice total stay the same (within a paisa). Saved item price, price mode and tax rate are untouched.

### Changing a line's tax rate

The Rate never changes.

| Price type | Before | Change | After |
| --- | --- | --- | --- |
| Tax Extra | Rate 100, 13%, total 113 | → 5% | Rate 100, tax 5, total **105** |
| Tax Included | Rate 113, 13%, total 113 | → 5% | Rate 113, base 107.62, tax 5.38, total **113** |

### Payment

```
cash    → received = total,                         due = 0
credit  → received = 0,                             due = total
partial → received = clamp(entered, 0, total),      due = total − received
```

---

## 8. Editing an invoice line

Opened by selecting a line. Fields:

| Field | Behaviour |
| --- | --- |
| Quantity | Stepper − / + (minimum 1) and direct decimal entry. Empty or 0 becomes 1 |
| Unit | Pick from the unit list. Label only; no unit conversion |
| Rate | Money input. Supporting text "Invoice price type: Tax Extra" (or Tax Included) |
| Rate entered as | **With Tax / Without Tax**. Shown when the line's tax is above 0%. Switchable only when "Allow inclusive/exclusive tax for invoice" is OFF; read-only when it is ON. See below |
| Discount | None, Percentage or Fixed Amount. Percentage over 100 is an error. Shows a live preview "Discount of Rs. X, applied before tax." |
| Tax | **Only when item-wise tax is ON.** Options: No Tax, then every tax rate. Helper "Only for this invoice" |
| Summary | Discount (if any), Tax or "Included Tax", Line Total — all live |

Rules:

- **Rate precision:** the field shows the rate at up to 2 decimals. If the user does not touch it, the full-precision rate is kept. Only a typed value replaces it. (Otherwise 1,130 ÷ 1.13 would drift.)
- **Tax override** affects this line only. The inventory item is not changed.
- When item-wise tax is OFF the tax selector is hidden and the bill-level tax is used for the line summary.
- "Update" applies the changes; closing without it discards them.

### Rate entered as (With Tax / Without Tax)

Lets the seller type a tax-inclusive rate on an invoice that has no Price Type control.

- **Setting OFF → switchable.** Invoices are always Tax Extra, so this is the only way to type a tax-inclusive rate.
  Opens on Without Tax.
- **Setting ON → shown but disabled.** It displays the mode that matches the invoice's price type
  (Tax Included → With Tax, Tax Extra → Without Tax) for information only and cannot be changed here.
  The invoice's Tax Included / Tax Extra control is the one place to change it.
- **Switching it converts the number in the Rate field** so the line total does not move:
  With Tax → Without Tax: `rate ÷ (1 + t/100)`; Without Tax → With Tax: `rate × (1 + t/100)`.
- **Typing** a rate is read in the selected mode.
- On Update the entered rate is converted back to the invoice's price type:
  `lineRate = convertRateBetweenModes(enteredRate, t, entryMode, invoiceMode)` where With Tax ≙ `included`, Without Tax ≙ `extra`.
- The helper under Rate always reads "Invoice price type: Tax Extra" (or Tax Included); the mode control adds no extra text.
- Hidden when the line has No Tax or a 0% rate, because both modes are then the same number.
- If the tax rate is changed while the modes differ, the typed number is kept and the invoice rate is recalculated from it.
- The inventory item's saved price and price mode are never changed.

Example on a Tax Extra invoice, VAT 13%: line Rate 1,000 → switch to With Tax → field shows 1,130 →
type 2,260 → Update → line shows `1 × Rs. 2,000`, VAT 260, total 2,260.

### Removing a line

Removing shows "{name} removed" with **Undo** for 5 seconds. Undo puts the same line back at its original position.

### Invoice-level discount

"Add Discount" → Percentage or Fixed Amount + value → Apply. Once set it reads "Discount: 10%" and can be changed or removed.

---

## 9. Display rules

### Line (draft and saved sale use the same rules)

```
{name}                                             {line total}
{qty} {unit} × {rate}
{N% discount | Discount} · −{discount amount}      only if a line discount exists
{tax line}                                         only if tax is per line
```

Tax line:

| Case | Text |
| --- | --- |
| No tax on the line, or tax is set for the whole bill | (nothing) |
| Tax amount is 0 (Exempt) | `Exempt` |
| Tax Extra | `VAT 13% · Rs. 130` |
| Tax Included | `Includes VAT 13% · Rs. 130` |

### Summary — hide rows that are zero

**Tax Extra**
```
Subtotal            (only if there is a discount or tax)
Discount   − X      (only if > 0)
Tax        X        (only if > 0; "Tax (VAT 13%)" for bill-level tax)
Total
```

**Tax Included**
```
Subtotal            (only if there is a discount)
Discount   − X      (only if > 0)
Total
Includes tax Rs. X  (only if > 0)
```

### Price Breakdown (opened from the summary)

Total Item Amount (labelled "(tax included)" on Tax Included invoices) · Total Discount Amount (line + invoice) · Taxable Amount · Total Tax Amount · Total.

### Money and other formatting

- `formatMoney()` is the single formatter: `Rs. 1,130.00`, Western thousands grouping, 2 decimals.
- Compact form (lists and line rows) drops `.00` on whole amounts: `Rs. 1,130`, but `Rs. 107.62`.
- Summary, payment and breakdown always show 2 decimals.
- Invoice number: `#` + 4 digits, zero-padded. Date: `6 Oct 2026` (AD).
- Discount label: `None`, `10%`, or `Rs. 200`.

---

## 10. Saving a sale

**Can save when:** at least one line, and not (Partial with received > total). Otherwise the save actions are disabled.

On save:

1. Build the **snapshot** (`buildSale`): every line's name, unit, quantity, rate, discount input, tax id / label / percent, and gross, discount, net, base, tax, total; plus invoice price type, whether tax was item-wise, bill tax label, invoice discount, totals, payment (type, received, due), notes, party name, number, date.
2. Add it to the top of the sales list.
3. Reduce stock for each tracked item by the quantity sold (may go below zero).
4. Show "Sale saved successfully."
5. **Save Sale** → open the saved sale. **Save & New** → clear the draft for the next invoice (new number, default price type).

Saved sales are never edited or recalculated.

---

## 11. Saved sale (history)

- Reads **only** the snapshot. It must not look at current settings, tax rates or items.
- Line tax is shown when `sale.itemWiseTax` is true; price type wording follows `sale.invoicePriceMode`.
- A sale saved as Tax Included with item-wise tax ON looks exactly the same after both settings are turned OFF, or after its tax rate or item is edited.
- Shows: number, customer, date, "Prices: Tax Included | Tax Extra", lines, summary, payment type, received, balance due, notes.

---

## 12. Other screens

| Screen | Functionality |
| --- | --- |
| Home | Shortcut to New Sale; Total sales (Σ total); To receive (Σ due); shortcuts to Add Item and Tax & Pricing; 4 most recent sales |
| Sales | All sales, newest first: party, number, date, total, and "Paid" or "Due Rs. X". New Sale action. Empty state |
| Items | Search, list, Add Item. Empty and no-results states |
| Parties | List with phone and amount to receive (Σ due of that party's sales) or "Settled". Add Party (name required, phone optional) |
| More → Settings | Tax & Pricing (with a one-line summary of current settings); Reset demo data (confirmed; restores all seed data and default settings) |
| Customer picker | Cash Sale (no customer) or any party |
| Invoice options | Link to Tax & Pricing settings; Clear this invoice |

Routes: `/` · `/sales` · `/sales/new` · `/sales/[id]` · `/items` · `/items/new` · `/items/[id]` · `/items/[id]/edit` · `/parties` · `/more` · `/settings` · `/settings/tax-pricing` · `/settings/tax-rates`.

States to cover: loading (while stored data loads), storage error banner, empty lists, no search results, record not found, validation errors, success toast.

---

## 13. Persistence

- Persist `settings`, `taxRates`, `items`, `parties`, `sales` locally (mobile: AsyncStorage key `karobar-item-wise-tax-v1`).
- The invoice draft is in memory only; it is not persisted.
- First run loads the seed data.

---

## 14. Test vectors

Use these to confirm the web build matches. All are covered by `calc.test.ts` or were checked in the running app.

| # | Input | Expected |
| --- | --- | --- |
| 1 | Item 1,130 With Tax 13% on Tax Extra | Rate 1,000 · tax 130 · total 1,130 |
| 2 | Same item on Tax Included | Rate 1,130 · included tax 130 · total 1,130 |
| 3 | Item 1,000 Without Tax 13% on Tax Extra | Rate 1,000 · tax 130 · total 1,130 |
| 4 | Same item on Tax Included | Rate 1,130 · included tax 130 · total 1,130 |
| 5 | Tax Extra, rate 100, tax 13% → 5% | tax 5 · total 105 |
| 6 | Tax Included, rate 113, tax 13% → 5% | base 107.62 · tax 5.38 · total 113 |
| 7 | Tax Extra, rate 1,000, 10% discount, 13% | base 900 · tax 117 · total 1,017 |
| 8 | Tax Included, rate 1,130, 10% discount, 13% | base 900 · tax 117 · total 1,017 |
| 9 | Tax Included, rate 1,130, 10% discount, 5% | discount 113 · included tax 48.43 · total 1,017 |
| 10 | Tax Extra: Rice 2×500 Exempt, Oil 1×500 13%, Consulting 1×10,000 5% | taxes 0 / 65 / 500 · subtotal 11,500 · tax 565 · total 12,065 |
| 11 | Tax Extra: 1×100,000 at 13% + 2×500 Exempt, invoice discount Rs. 1,000 | subtotal 101,000 · discount 1,000 · tax 12,871.29 · total 112,871.29 |
| 12 | Tax Included: 1,130 at 13% with fixed line discount 113 → switch to Tax Extra | rate 1,000 · line discount 100 · total unchanged |
| 13 | Fixed discount 500 on amount 100 | discount 100 (capped) |
| 14 | Total 1,130: Cash / Credit / Partial 500 | received 1,130 due 0 / received 0 due 1,130 / received 500 due 630 |
| 15 | Item-wise OFF, Oil 500, bill tax VAT 13%, Tax Extra | subtotal 500 · Tax (VAT 13%) 65 · total 565 |
| 16 | Inclusive/exclusive OFF, line 13%: edit, set "Rate entered as" With Tax, type 2,260 | line Rate 2,000 · tax 260 · total 2,260 |

---

## 15. Acceptance checklist

1. Settings → Tax & Pricing opens.
2. Item-wise tax can be enabled (with confirmation).
3. Add Item then shows Tax Rate, With Tax, Without Tax.
4. "MacBook, 1,130, With Tax, VAT 13%" can be created.
5. Inclusive/exclusive can be enabled.
6. New Sale shows the Price Type control with Tax Included / Tax Extra.
7. That MacBook on Tax Extra: Rate 1,000, Tax 130, Total 1,130.
8. On Tax Included: Rate 1,130, Included Tax 130, Total 1,130.
9. Changing Price Type converts existing rates correctly.
10. Changing Price Type does not change the saved item.
11. Rice (Exempt) can be on the same invoice.
12. Lines can use Exempt, 5% and 13% together.
13. A line's tax can be changed for the current invoice only.
14. Tax changes behave differently per price type (section 7).
15. Item-wise tax OFF hides item tax controls on new transactions.
16. Inclusive/exclusive OFF hides the Price Type control.
17. Old invoices are unchanged after settings change.
18. A seller can complete a sale without seeing "Inclusive", "Exclusive" or "Taxable Base".
19. With Tax / Without Tax (inventory) and Tax Included / Tax Extra (invoice) are visibly distinct.

---

## 16. Decisions and known gaps

Decisions made where the original brief was silent — confirm or change them for web:

- **Item-wise tax OFF:** the item price is used as the Rate as it is, and tax is optional and bill-level.
- **Tax Included summary** shows "Includes tax Rs. X" under the total instead of a tax row.
- **Adding the same item twice** increases the quantity rather than adding a second line.
- **Stock** may go negative; there is no stock check.
- **Dates are AD.** Bikram Sambat is not implemented.
- **Unit change on a line** is a label only.

Not built: editing or deleting a saved sale, deleting items or parties, purchase side, additional charges, round-off, images, printing/sharing, secondary units, multiple payment modes.
