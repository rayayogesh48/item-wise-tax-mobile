import { ChevronsUpDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { calculateInvoiceLine, convertRateBetweenModes } from '@/domain/calc';
import { discountLabel, formatMoney, formatNumberInput, invoicePriceModeLabel, parseNumber, savedPriceModeLabel, taxLabel } from '@/domain/format';
import type { DraftLine, InvoicePriceMode, SavedPriceMode, TaxRate } from '@/domain/types';
import { colors, radius, space, type } from '@/theme/tokens';

import { BottomSheet, useMountedSheet } from './BottomSheet';
import { DiscountFields, useDiscountForm } from './DiscountSheet';
import { SelectField } from './Field';
import { MoneyInput } from './MoneyInput';
import { Button, Divider, KeyValue } from './primitives';
import { QuantityStepper } from './QuantityStepper';
import { TaxRateList } from './TaxRatePicker';
import { UnitList } from './UnitPicker';

type Props = {
  line: DraftLine;
  mode: InvoicePriceMode;
  /** When false the tax selector is hidden and `billTax` applies. */
  itemWiseTax: boolean;
  taxRates: TaxRate[];
  billTax: TaxRate | null;
  /**
   * Whether the With Tax / Without Tax chip on the Rate field can be switched. When the invoice has
   * its own Tax Included / Tax Extra control the chip is shown read-only, mirroring that choice,
   * so there is only ever one place to change whether a rate includes tax.
   */
  allowRateEntryMode: boolean;
  onClose: () => void;
  onSave: (line: DraftLine) => void;
};

type View_ = 'main' | 'unit' | 'discount' | 'tax';

const toInvoiceMode = (entry: SavedPriceMode): InvoicePriceMode => (entry === 'with_tax' ? 'included' : 'extra');

const titles: Record<View_, string> = { main: 'Edit Item', unit: 'Select Unit', discount: 'Discount', tax: 'Select Tax' };

/**
 * Edits one invoice line. Unit, discount and tax open as views inside this same sheet
 * rather than as sheets on top of it. Mount it only while editing (key it by line id).
 */
export function EditInvoiceItemSheet({ line, mode, itemWiseTax, taxRates, billTax, allowRateEntryMode, onClose, onSave }: Props) {
  const { open, close } = useMountedSheet(onClose);
  const [view, setView] = useState<View_>('main');
  const [quantityText, setQuantityText] = useState(String(line.quantity));
  // The rate as the user is entering it. It starts in the invoice's own price type and can be
  // flipped to With Tax / Without Tax for this edit; it is converted back when applied.
  const [entryMode, setEntryMode] = useState<SavedPriceMode>(mode === 'included' ? 'with_tax' : 'without_tax');
  const [enteredRate, setEnteredRate] = useState(line.rate);
  const [rateText, setRateText] = useState(formatNumberInput(line.rate));
  const [unit, setUnit] = useState(line.unit);
  const [taxRateId, setTaxRateId] = useState(line.taxRateId);
  const discountForm = useDiscountForm(line.discount);

  const quantity = Math.max(parseNumber(quantityText), 0);
  const discount = discountForm.error ? null : discountForm.discount;
  const tax = itemWiseTax ? (taxRates.find((r) => r.id === taxRateId) ?? null) : billTax;
  const taxPercent = tax?.rate ?? 0;
  // What the line stores: the rate in the invoice's price type, at full precision.
  const rate = convertRateBetweenModes(enteredRate, taxPercent, toInvoiceMode(entryMode), mode);
  const otherMode: SavedPriceMode = entryMode === 'with_tax' ? 'without_tax' : 'with_tax';

  const changeRateText = (text: string) => {
    setRateText(text);
    setEnteredRate(parseNumber(text));
  };

  /** Flips how the rate is entered and converts the number, so the line total does not move. */
  const changeEntryMode = (next: SavedPriceMode) => {
    if (next === entryMode) return;
    const converted = convertRateBetweenModes(enteredRate, taxPercent, toInvoiceMode(entryMode), toInvoiceMode(next));
    setEntryMode(next);
    setEnteredRate(converted);
    setRateText(formatNumberInput(converted));
  };
  const amounts = calculateInvoiceLine({ quantity, rate, taxRate: taxPercent, discount }, mode);
  const back = view === 'main' ? undefined : () => setView('main');

  const save = () => {
    onSave({ ...line, quantity: quantity || 1, rate, unit, taxRateId, discount });
    close();
  };

  return (
    <BottomSheet
      visible={open}
      onClose={close}
      onBack={back}
      title={titles[view]}
      footer={
        view === 'main' ? (
          <Button label="Update" onPress={save} style={{ flex: 1 }} />
        ) : view === 'discount' ? (
          <>
            <Button label="Remove" variant="secondary" onPress={() => { discountForm.setText(''); setView('main'); }} style={{ flex: 1 }} />
            <Button label="Apply" disabled={Boolean(discountForm.error)} onPress={() => setView('main')} style={{ flex: 1 }} />
          </>
        ) : undefined
      }
    >
      {view === 'main' ? (
        <>
          <Text style={type.headlineSm}>{line.name}</Text>
          <QuantityStepper value={quantityText} onChange={setQuantityText} />
          <SelectField label="Unit" value={unit} onPress={() => setView('unit')} />
          <MoneyInput
            label="Rate"
            value={rateText}
            onChangeText={changeRateText}
            helper={`Invoice price type: ${invoicePriceModeLabel[mode]}`}
            suffix={
              taxPercent > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !allowRateEntryMode }}
                  accessibilityLabel={
                    allowRateEntryMode
                      ? `Rate entered ${savedPriceModeLabel[entryMode]}. Switch to ${savedPriceModeLabel[otherMode]}`
                      : `Rate entered ${savedPriceModeLabel[entryMode]}. Set by the invoice price type`
                  }
                  disabled={!allowRateEntryMode}
                  hitSlop={8}
                  onPress={() => changeEntryMode(otherMode)}
                  style={({ pressed }) => [styles.modeChip, pressed && { opacity: 0.6 }, !allowRateEntryMode && styles.modeChipDisabled]}
                >
                  <Text style={[type.bodySm, !allowRateEntryMode && { color: colors.textDisabled }]}>{savedPriceModeLabel[entryMode]}</Text>
                  {allowRateEntryMode ? <ChevronsUpDown size={14} color={colors.textSecondary} /> : null}
                </Pressable>
              ) : null
            }
          />
          <Divider />
          <SelectField label="Discount" value={discountLabel(discount)} onPress={() => setView('discount')} />
          {itemWiseTax ? (
            <SelectField label="Tax" value={tax ? taxLabel(tax) : 'No Tax'} helper="Only for this invoice" onPress={() => setView('tax')} />
          ) : null}
          <Divider />
          <View style={{ gap: space.sm }}>
            {amounts.discount > 0 ? <KeyValue label="Discount" value={`− ${formatMoney(amounts.discount)}`} /> : null}
            {tax ? <KeyValue label={mode === 'included' ? 'Included Tax' : 'Tax'} value={formatMoney(amounts.tax)} /> : null}
            <KeyValue label="Line Total" value={formatMoney(amounts.total)} strong />
          </View>
        </>
      ) : null}
      {view === 'unit' ? <UnitList value={unit} onChange={(next) => { setUnit(next); setView('main'); }} /> : null}
      {view === 'discount' ? <DiscountFields form={discountForm} amount={rate * quantity} autoFocus /> : null}
      {view === 'tax' ? (
        <TaxRateList
          taxRates={taxRates}
          value={taxRateId}
          allowNoTax
          hint="Changes tax for this invoice only. The item keeps its saved tax rate."
          onChange={(id) => { setTaxRateId(id); setView('main'); }}
        />
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    height: 32,
    paddingHorizontal: space.md,
    marginRight: -space.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  modeChipDisabled: { backgroundColor: colors.borderSoft },
});
