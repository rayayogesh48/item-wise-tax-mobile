import { router } from 'expo-router';
import { Plus, ReceiptText } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { AppHeader, HeaderAction } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { Card, Divider, Screen } from '@/components/primitives';
import { SaleRow } from '@/features/sales/SaleRow';
import { useAppStore } from '@/store/useAppStore';
import { colors, space } from '@/theme/tokens';

export default function SalesScreen() {
  const sales = useAppStore((s) => s.sales);
  const newSale = () => router.push('/sales/new');
  return (
    <Screen>
      <AppHeader title="Sales" back={false} right={<HeaderAction label="New Sale" icon={<Plus size={18} color={colors.primary} />} onPress={newSale} />} />
      <ScrollView contentContainerStyle={{ padding: space.lg }}>
        <Card>
          {sales.length === 0 ? (
            <EmptyState icon={<ReceiptText size={24} color={colors.primary} />} title="No sales yet" body="Create your first invoice to see it here." actionLabel="New Sale" onAction={newSale} />
          ) : null}
          {sales.map((sale, index) => (
            <View key={sale.id}>
              {index > 0 ? <Divider inset={space.lg} /> : null}
              <SaleRow sale={sale} onPress={() => router.push(`/sales/${sale.id}`)} />
            </View>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}
