import { Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { discountLabel, formatMoney, formatQuantity } from '@/domain/format';
import type { Discount, InvoicePriceMode, LineAmounts } from '@/domain/types';
import { colors, space, type } from '@/theme/tokens';

type Props = {
  name: string;
  quantity: number;
  unit: string;
  rate: number;
  amounts: LineAmounts;
  mode: InvoicePriceMode;
  discount: Discount | null;
  /** null = no tax on this line */
  taxLabel: string | null;
  /** false when tax is set for the whole bill, so lines stay free of tax details */
  showTax: boolean;
  onPress?: () => void;
  onRemove?: () => void;
};

/** One invoice line. Used for both the draft and saved sales, so it only displays what it is given. */
export function ItemCard({ name, quantity, unit, rate, amounts, mode, discount, taxLabel, showTax, onPress, onRemove }: Props) {
  const taxLine = !showTax || !taxLabel
    ? null
    : amounts.tax === 0
      ? taxLabel
      : `${mode === 'included' ? 'Includes ' : ''}${taxLabel} · ${formatMoney(amounts.tax, { compact: true })}`;

  return (
    <View>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? `Edit ${name}` : undefined}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }]}
      >
        <View style={styles.details}>
          <Text style={type.titleSm} numberOfLines={2}>{name}</Text>
          <Text style={[type.bodySm, type.money]}>
            {formatQuantity(quantity)} {unit} × {formatMoney(rate, { compact: true })}
          </Text>
          {amounts.discount > 0 ? (
            <Text style={[type.bodySm, type.money]}>
              {discount?.type === 'percent' ? `${discountLabel(discount)} discount` : 'Discount'} · −{formatMoney(amounts.discount, { compact: true })}
            </Text>
          ) : null}
          {taxLine ? <Text style={[type.bodySm, type.money]}>{taxLine}</Text> : null}
        </View>
        <View style={[styles.side, onRemove ? { paddingBottom: 36 } : null]}>
          <Text style={[type.titleSm, type.money]}>{formatMoney(amounts.total, { compact: true })}</Text>
        </View>
      </Pressable>
      {/* A sibling of the row, not a child: a button inside a button is invalid and hard to hit. */}
      {onRemove ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${name}`} hitSlop={8} onPress={onRemove} style={styles.remove}>
          <Trash2 size={18} color={colors.danger} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.md, paddingVertical: space.md },
  details: { flex: 1, gap: space.xs },
  side: { alignItems: 'flex-end' },
  remove: { position: 'absolute', right: space.sm, bottom: space.sm, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
