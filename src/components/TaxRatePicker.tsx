import { Text, View } from 'react-native';

import { taxLabel } from '@/domain/format';
import type { TaxRate } from '@/domain/types';
import { space, type } from '@/theme/tokens';

import { BottomSheet } from './BottomSheet';
import { RadioOption } from './RadioOption';

type ListProps = {
  taxRates: TaxRate[];
  /** null = "No Tax" */
  value: string | null;
  onChange: (id: string | null) => void;
  /** Adds the "No Tax" choice, used when overriding tax on an invoice line or bill. */
  allowNoTax?: boolean;
  hint?: string;
};

export function TaxRateList({ taxRates, value, onChange, allowNoTax, hint }: ListProps) {
  return (
    <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
      {hint ? <Text style={type.bodySm}>{hint}</Text> : null}
      {allowNoTax ? <RadioOption title="No Tax" selected={value === null} onPress={() => onChange(null)} /> : null}
      {taxRates.map((rate) => (
        <RadioOption
          key={rate.id}
          title={rate.name || `${rate.rate}%`}
          trailing={rate.name ? `${rate.rate}%` : undefined}
          selected={value === rate.id}
          onPress={() => onChange(rate.id)}
        />
      ))}
    </View>
  );
}

type Props = ListProps & { visible: boolean; onClose: () => void; title?: string };

/** "Select Tax" bottom sheet. Picking a rate applies it and closes the sheet. */
export function TaxRatePicker({ visible, onClose, title = 'Select Tax', onChange, ...list }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <TaxRateList
        {...list}
        onChange={(id) => {
          onChange(id);
          onClose();
        }}
      />
    </BottomSheet>
  );
}

export function taxRateName(taxRates: TaxRate[], id: string | null): string {
  const rate = taxRates.find((r) => r.id === id);
  return rate ? taxLabel(rate) : 'No Tax';
}
