import { useState } from 'react';
import { Text, View } from 'react-native';

import { calculateDiscount } from '@/domain/calc';
import { formatMoney, formatNumberInput, parseNumber } from '@/domain/format';
import type { Discount } from '@/domain/types';
import { space, type } from '@/theme/tokens';

import { BottomSheet, useMountedSheet } from './BottomSheet';
import { MoneyInput } from './MoneyInput';
import { Button } from './primitives';
import { SegmentedControl } from './SegmentedControl';

const typeOptions = [
  { value: 'percent', label: 'Percentage' },
  { value: 'fixed', label: 'Fixed Amount' },
] as const;

/** Editing state for a discount, shared by the sheet below and the invoice item editor. */
export function useDiscountForm(initial: Discount | null) {
  const [kind, setKind] = useState<Discount['type']>(initial?.type ?? 'percent');
  const [text, setText] = useState(initial ? formatNumberInput(initial.value) : '');
  const value = parseNumber(text);
  const error = kind === 'percent' && value > 100 ? 'Discount cannot be more than 100%.' : undefined;
  const discount: Discount | null = value > 0 ? { type: kind, value } : null;
  return { kind, setKind, text, setText, error, discount };
}

type FormProps = { form: ReturnType<typeof useDiscountForm>; amount: number; autoFocus?: boolean };

export function DiscountFields({ form, amount, autoFocus }: FormProps) {
  const off = calculateDiscount(amount, form.discount);
  return (
    <View style={{ gap: space.lg }}>
      <SegmentedControl options={typeOptions} value={form.kind} onChange={form.setKind} accessibilityLabel="Discount type" />
      <MoneyInput
        label={form.kind === 'percent' ? 'Discount (%)' : 'Discount amount'}
        prefix={form.kind === 'percent' ? '%' : 'Rs.'}
        value={form.text}
        onChangeText={form.setText}
        error={form.error}
        autoFocus={autoFocus}
      />
      {off > 0 && !form.error ? <Text style={type.bodySm}>Discount of {formatMoney(off)}, applied before tax.</Text> : null}
    </View>
  );
}

type Props = {
  visible: boolean;
  onClose: () => void;
  value: Discount | null;
  /** Amount the discount applies to, for the live preview. */
  amount: number;
  onApply: (discount: Discount | null) => void;
};

/** Invoice-level discount. */
export function DiscountSheet({ visible, onClose, value, amount, onApply }: Props) {
  return visible ? <Inner onClose={onClose} value={value} amount={amount} onApply={onApply} /> : null;
}

function Inner({ onClose, value, amount, onApply }: Omit<Props, 'visible'>) {
  const { open, close } = useMountedSheet(onClose);
  const form = useDiscountForm(value);
  return (
    <BottomSheet
      visible={open}
      onClose={close}
      title="Discount"
      footer={
        <>
          {value ? <Button label="Remove" variant="danger" onPress={() => { onApply(null); close(); }} style={{ flex: 1 }} /> : null}
          <Button label="Apply" disabled={Boolean(form.error)} onPress={() => { onApply(form.discount); close(); }} style={{ flex: 1 }} />
        </>
      }
    >
      <DiscountFields form={form} amount={amount} autoFocus />
    </BottomSheet>
  );
}
