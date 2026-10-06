import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate, formatMoney, invoiceNumber } from '@/domain/format';
import type { Sale } from '@/domain/types';
import { colors, space, type } from '@/theme/tokens';

export function paymentStatus(sale: Sale): { label: string; due: boolean } {
  if (sale.payment.due <= 0) return { label: 'Paid', due: false };
  return { label: `Due ${formatMoney(sale.payment.due, { compact: true })}`, due: true };
}

export function SaleRow({ sale, onPress }: { sale: Sale; onPress: () => void }) {
  const status = paymentStatus(sale);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={type.title} numberOfLines={1}>{sale.partyName}</Text>
        <Text style={type.bodySm}>{invoiceNumber(sale.number)} · {formatDate(sale.date)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={[type.title, type.money]}>{formatMoney(sale.totals.total, { compact: true })}</Text>
        <Text style={[type.bodySm, type.money, { color: status.due ? colors.danger : colors.primaryPressed }]}>{status.label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, minHeight: 64 },
});
