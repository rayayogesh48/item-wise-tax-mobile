import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { InvoiceSummary } from '@/components/InvoiceSummary';
import { ItemCard } from '@/components/ItemCard';
import { NotFound } from '@/components/NotFound';
import { Card, Divider, KeyValue, Screen } from '@/components/primitives';
import { discountLabel, formatDate, formatMoney, invoiceNumber, invoicePriceModeLabel } from '@/domain/format';
import { useAppStore } from '@/store/useAppStore';
import { colors, space, type } from '@/theme/tokens';

const paymentLabel = { cash: 'Cash', credit: 'Credit', partial: 'Partial' } as const;

/** Shows a saved sale exactly as it was stored. Nothing here reads the current settings or tax rates. */
export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sale = useAppStore((s) => s.sales.find((x) => x.id === id));
  if (!sale) return <NotFound title="Sale" message="This sale could not be found." />;

  return (
    <Screen>
      <AppHeader title={`Sale ${invoiceNumber(sale.number)}`} />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <Card style={styles.block}>
          <Text style={type.caption}>Customer</Text>
          <Text style={type.title}>{sale.partyName}</Text>
          <Text style={type.bodySm}>{formatDate(sale.date)} · Prices: {invoicePriceModeLabel[sale.invoicePriceMode]}</Text>
        </Card>

        <Text style={[type.headlineSm, styles.heading]}>Items ({sale.lines.length})</Text>
        <Card>
          {sale.lines.map((line, index) => (
            <View key={line.id}>
              {index > 0 ? <Divider inset={space.md} /> : null}
              <ItemCard
                name={line.name}
                quantity={line.quantity}
                unit={line.unit}
                rate={line.rate}
                amounts={line}
                mode={sale.invoicePriceMode}
                discount={line.discountInput}
                taxLabel={line.taxLabel}
                showTax={sale.itemWiseTax}
              />
            </View>
          ))}
        </Card>

        <Text style={[type.headlineSm, styles.heading]}>Summary</Text>
        <Card>
          {sale.discountInput ? (
            <View style={{ paddingHorizontal: space.md, paddingTop: space.md }}>
              <Text style={type.bodySm}>Invoice discount: {discountLabel(sale.discountInput)}</Text>
            </View>
          ) : null}
          <InvoiceSummary totals={sale.totals} billTaxLabel={sale.billTaxLabel} />
        </Card>

        <Text style={[type.headlineSm, styles.heading]}>Payment</Text>
        <Card style={styles.block}>
          <KeyValue label="Payment Type" value={paymentLabel[sale.payment.type]} />
          <KeyValue label="Received" value={formatMoney(sale.payment.received)} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[type.bodySm, sale.payment.due > 0 && { color: colors.danger }]}>Balance Due</Text>
            <Text style={[type.titleSm, type.money, sale.payment.due > 0 && { color: colors.danger }]}>{formatMoney(sale.payment.due)}</Text>
          </View>
        </Card>

        {sale.notes ? (
          <Card style={styles.block}>
            <Text style={type.caption}>Notes</Text>
            <Text style={type.body}>{sale.notes}</Text>
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { padding: space.md, gap: space.sm },
  heading: { marginTop: space.sm, marginLeft: space.xs },
});
