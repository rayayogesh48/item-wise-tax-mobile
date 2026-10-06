import { Text, View } from 'react-native';

import type { InvoicePriceMode, SavedPriceMode } from '@/domain/types';
import { space, type } from '@/theme/tokens';

import { RadioOption } from './RadioOption';
import { SegmentedControl } from './SegmentedControl';

const savedOptions = [
  { value: 'with_tax', label: 'With Tax' },
  { value: 'without_tax', label: 'Without Tax' },
] as const;

const savedHelper: Record<SavedPriceMode, string> = {
  with_tax: 'Entered price already includes tax.',
  without_tax: 'Tax will be added to the entered price.',
};

/** INVENTORY wording: how a saved item price was entered. */
export function SavedPriceModeSelector({ value, onChange }: { value: SavedPriceMode; onChange: (mode: SavedPriceMode) => void }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text style={type.titleSm}>Price entered as</Text>
      <SegmentedControl options={savedOptions} value={value} onChange={onChange} accessibilityLabel="Price entered as" />
      <Text style={type.bodySm}>{savedHelper[value]}</Text>
    </View>
  );
}

const invoiceOptions: { value: InvoicePriceMode; title: string; description: string }[] = [
  { value: 'included', title: 'Tax Included', description: 'Rate already includes tax.' },
  { value: 'extra', title: 'Tax Extra', description: 'Tax is added to Rate.' },
];

/** INVOICE wording: how the Rate field behaves on one invoice. */
export function InvoicePriceModeSelector({ value, onChange }: { value: InvoicePriceMode; onChange: (mode: InvoicePriceMode) => void }) {
  return (
    <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
      {invoiceOptions.map((option) => (
        <RadioOption
          key={option.value}
          title={option.title}
          description={option.description}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}
