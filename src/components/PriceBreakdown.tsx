import { StyleSheet, Text, View } from 'react-native';

import { savedPriceBreakdown } from '@/domain/calc';
import { formatMoney } from '@/domain/format';
import type { SavedPriceMode } from '@/domain/types';
import { colors, radius, space, type } from '@/theme/tokens';

import { KeyValue } from './primitives';

/** Read-only preview of what a saved item price means. Deliberately not styled like a form. */
export function PriceBreakdown({ price, mode, taxRate }: { price: number; mode: SavedPriceMode; taxRate: number }) {
  const { base, tax, final } = savedPriceBreakdown(price, mode, taxRate);
  return (
    <View style={styles.box}>
      <Text style={type.label}>Price Breakdown</Text>
      <KeyValue label="Base Price" value={formatMoney(base, { compact: true })} />
      <KeyValue label="Tax" value={formatMoney(tax, { compact: true })} />
      <View style={styles.rule} />
      <KeyValue label="Final Price" value={formatMoney(final, { compact: true })} strong />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.surfaceMuted, borderRadius: radius.card, padding: space.md, gap: space.sm },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
