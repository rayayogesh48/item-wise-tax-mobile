import { router, useLocalSearchParams } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader, HeaderAction } from '@/components/AppHeader';
import { NotFound } from '@/components/NotFound';
import { PriceBreakdown } from '@/components/PriceBreakdown';
import { Card, Divider, Screen } from '@/components/primitives';
import { formatMoney, formatQuantity, savedPriceModeLabel, taxLabel } from '@/domain/format';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, space, type } from '@/theme/tokens';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useAppStore((s) => s.items.find((i) => i.id === id));
  const taxRates = useAppStore((s) => s.taxRates);
  const itemWiseTax = useAppStore((s) => s.settings.itemWiseTaxEnabled);
  if (!item) return <NotFound title="Item" message="This item no longer exists." />;
  const taxRate = taxRates.find((r) => r.id === item.taxRateId);

  return (
    <Screen>
      <AppHeader title="Item" right={<HeaderAction label="Edit" icon={<Pencil size={16} color={colors.primary} />} onPress={() => router.push(`/items/${item.id}/edit`)} />} />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
        <View style={{ gap: 2 }}>
          <Text style={styles.name}>{item.name}</Text>
          {item.category || item.sku ? <Text style={type.bodySm}>{[item.category, item.sku].filter(Boolean).join(' · ')}</Text> : null}
        </View>

        <Card>
          <Detail label="Sales Price" value={formatMoney(item.salesPrice, { compact: true })} note={itemWiseTax ? savedPriceModeLabel[item.salesPriceMode] : undefined} />
          {itemWiseTax && taxRate ? (
            <>
              <Divider inset={space.lg} />
              <Detail label="Tax Rate" value={taxLabel(taxRate)} note={taxRate.rate === 0 ? '0% tax' : undefined} />
            </>
          ) : null}
          <Divider inset={space.lg} />
          <Detail label="Unit" value={item.unit} />
          {item.stock !== null ? (
            <>
              <Divider inset={space.lg} />
              <Detail label="Stock" value={`${formatQuantity(item.stock)} ${item.unit}`} />
            </>
          ) : null}
        </Card>

        {itemWiseTax && taxRate ? <PriceBreakdown price={item.salesPrice} mode={item.salesPriceMode} taxRate={taxRate.rate} /> : null}
      </ScrollView>
    </Screen>
  );
}

function Detail({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <View style={styles.detail}>
      <Text style={[type.bodySm, { flex: 1 }]}>{label}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[type.title, type.money]}>{value}</Text>
        {note ? <Text style={type.caption}>{note}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  name: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 30, color: colors.text },
  detail: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, minHeight: 56 },
});
