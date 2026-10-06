import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatMoney, formatQuantity, savedPriceModeLabel, taxLabel } from '@/domain/format';
import type { Item, TaxRate } from '@/domain/types';
import { colors, space, type } from '@/theme/tokens';

type Props = { item: Item; taxRates: TaxRate[]; showTax: boolean; onPress: () => void; badge?: number };

/** "With Tax · VAT 13%", or just "Exempt". Empty when item-wise tax is off. */
export function itemTaxMeta(item: Item, taxRates: TaxRate[], showTax: boolean): string | null {
  if (!showTax) return null;
  const rate = taxRates.find((r) => r.id === item.taxRateId);
  if (!rate) return null;
  return rate.rate === 0 ? taxLabel(rate) : `${savedPriceModeLabel[item.salesPriceMode]} · ${taxLabel(rate)}`;
}

/** An inventory item in the Items list and in the invoice item picker. */
export function CatalogItemRow({ item, taxRates, showTax, onPress, badge }: Props) {
  const meta = itemTaxMeta(item, taxRates, showTax);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={type.title} numberOfLines={1}>{item.name}</Text>
        {meta ? <Text style={type.bodySm}>{meta}</Text> : null}
        {item.stock !== null ? <Text style={type.caption}>Stock: {formatQuantity(item.stock)} {item.unit}</Text> : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: space.xs }}>
        <Text style={[type.title, type.money]}>{formatMoney(item.salesPrice, { compact: true })}</Text>
        {badge ? (
          <View style={styles.badge}><Text style={styles.badgeText}>{badge} added</Text></View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, minHeight: 64 },
  badge: { backgroundColor: colors.primarySoft, borderRadius: 10, paddingHorizontal: space.sm, paddingVertical: 2 },
  badgeText: { ...type.label, color: colors.primaryPressed },
});
