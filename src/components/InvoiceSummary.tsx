import { Info } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';

import { formatMoney } from '@/domain/format';
import type { InvoiceTotals } from '@/domain/types';
import { colors, fonts, space, type } from '@/theme/tokens';

import { BottomSheet } from './BottomSheet';
import { KeyValue } from './primitives';

/** Money text that counts to its new value instead of jumping. */
export function AnimatedMoney({ value, style }: { value: number; style?: StyleProp<TextStyle> }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    const began = Date.now();
    let frame = requestAnimationFrame(function tick() {
      const t = Math.min((Date.now() - began) / 320, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = start + (value - start) * eased;
      from.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <Text style={[type.money, style]} accessibilityLabel={formatMoney(value)}>{formatMoney(shown)}</Text>;
}

type Props = { totals: InvoiceTotals; billTaxLabel?: string | null };

/**
 * Tax Extra:    Subtotal − Discount + Tax = Total
 * Tax Included: Subtotal − Discount = Total, with the tax inside it noted underneath.
 * Zero rows are hidden.
 */
export function InvoiceSummary({ totals, billTaxLabel }: Props) {
  const [breakdown, setBreakdown] = useState(false);
  const extra = totals.mode === 'extra';
  const taxName = billTaxLabel ? `Tax (${billTaxLabel})` : 'Tax';
  const showSubtotal = totals.billDiscount > 0 || (extra && totals.tax > 0);

  return (
    <View style={styles.wrap}>
      {showSubtotal ? <KeyValue label="Subtotal" value={formatMoney(totals.subtotal)} /> : null}
      {totals.billDiscount > 0 ? <KeyValue label="Discount" value={`− ${formatMoney(totals.billDiscount)}`} /> : null}
      {extra && totals.tax > 0 ? <KeyValue label={taxName} value={formatMoney(totals.tax)} /> : null}
      {showSubtotal ? <View style={styles.rule} /> : null}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <AnimatedMoney value={totals.total} style={styles.total} />
      </View>
      <View style={styles.noteRow}>
        <Text style={[type.bodySm, type.money, { flex: 1 }]}>
          {!extra && totals.tax > 0 ? `Includes ${billTaxLabel ?? 'tax'} ${formatMoney(totals.tax)}` : ''}
        </Text>
        <Pressable accessibilityRole="button" hitSlop={10} onPress={() => setBreakdown(true)} style={styles.link}>
          <Info size={16} color={colors.textSecondary} />
          <Text style={type.bodySm}>Price breakdown</Text>
        </Pressable>
      </View>

      <BottomSheet visible={breakdown} onClose={() => setBreakdown(false)} title="Price Breakdown">
        <KeyValue label={extra ? 'Total Item Amount' : 'Total Item Amount (tax included)'} value={formatMoney(totals.itemAmount)} />
        <KeyValue label="Total Discount Amount" value={formatMoney(totals.lineDiscount + totals.billDiscount)} />
        <KeyValue label="Taxable Amount" value={formatMoney(totals.taxable)} />
        <KeyValue label="Total Tax Amount" value={formatMoney(totals.tax)} />
        <View style={styles.dashed} />
        <View style={styles.totalRow}>
          <Text style={type.headline}>Total</Text>
          <Text style={[type.headline, type.money]}>{formatMoney(totals.total)}</Text>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: space.md, gap: space.md },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dashed: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#d1d1d1' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 28, color: colors.text },
  total: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 28, color: colors.text },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  link: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
