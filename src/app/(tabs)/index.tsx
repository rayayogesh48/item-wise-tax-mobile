import { router } from 'expo-router';
import { ChevronRight, Package, Plus, ReceiptText, Settings2 } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { Card, Divider, Screen, SectionLabel } from '@/components/primitives';
import { formatMoney } from '@/domain/format';
import { SaleRow } from '@/features/sales/SaleRow';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, radius, space, type } from '@/theme/tokens';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const sales = useAppStore((s) => s.sales);
  const totalSales = sales.reduce((a, s) => a + s.totals.total, 0);
  const toReceive = sales.reduce((a, s) => a + s.payment.due, 0);

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]}>
        <View>
          <Text style={type.bodySm}>Namaste</Text>
          <Text style={styles.business}>Himalayan General Store</Text>
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push('/sales/new')} style={({ pressed }) => [styles.cta, pressed && { backgroundColor: colors.primaryPressed }]}>
          <View style={styles.ctaIcon}><Plus size={22} color={colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>New Sale</Text>
            <Text style={styles.ctaBody}>Create an invoice</Text>
          </View>
          <ChevronRight size={22} color={colors.onPrimary} />
        </Pressable>

        <View style={styles.stats}>
          <Card style={styles.stat}>
            <Text style={type.bodySm}>Total sales</Text>
            <Text style={[styles.statValue, type.money]}>{formatMoney(totalSales, { compact: true })}</Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={type.bodySm}>To receive</Text>
            <Text style={[styles.statValue, type.money, toReceive > 0 && { color: colors.danger }]}>{formatMoney(toReceive, { compact: true })}</Text>
          </Card>
        </View>

        <View style={styles.stats}>
          <Shortcut icon={<Package size={20} color={colors.primary} />} label="Add Item" onPress={() => router.push('/items/new')} />
          <Shortcut icon={<Settings2 size={20} color={colors.primary} />} label="Tax & Pricing" onPress={() => router.push('/settings/tax-pricing')} />
        </View>

        <View>
          <SectionLabel>Recent sales</SectionLabel>
          <Card>
            {sales.length === 0 ? (
              <EmptyState icon={<ReceiptText size={24} color={colors.primary} />} title="No sales yet" body="Your saved invoices will appear here." />
            ) : null}
            {sales.slice(0, 4).map((sale, index) => (
              <View key={sale.id}>
                {index > 0 ? <Divider inset={space.lg} /> : null}
                <SaleRow sale={sale} onPress={() => router.push(`/sales/${sale.id}`)} />
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Shortcut({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ flex: 1 }}>
      {({ pressed }) => (
        <Card style={[styles.shortcut, pressed && { backgroundColor: colors.surfaceMuted }]}>
          {icon}
          <Text style={type.titleSm}>{label}</Text>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg },
  business: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 30, color: colors.text },
  cta: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.primary },
  ctaIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  ctaTitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24, color: colors.onPrimary },
  ctaBody: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.onPrimary, opacity: 0.9 },
  stats: { flexDirection: 'row', gap: space.md },
  stat: { flex: 1, padding: space.md, gap: space.xs },
  statValue: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 28, color: colors.text },
  shortcut: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, minHeight: 48 },
});
