import { router } from 'expo-router';
import { Package, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AppHeader, HeaderAction } from '@/components/AppHeader';
import { CatalogItemRow } from '@/components/CatalogItemRow';
import { EmptyState } from '@/components/EmptyState';
import { SearchField } from '@/components/ItemPickerSheet';
import { Card, Divider, Screen } from '@/components/primitives';
import { useAppStore } from '@/store/useAppStore';
import { colors, space } from '@/theme/tokens';

export default function ItemsScreen() {
  const items = useAppStore((s) => s.items);
  const taxRates = useAppStore((s) => s.taxRates);
  const itemWiseTax = useAppStore((s) => s.settings.itemWiseTaxEnabled);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
  const addItem = () => router.push('/items/new');

  return (
    <Screen>
      <AppHeader title="Items" back={false} right={<HeaderAction label="Add Item" icon={<Plus size={18} color={colors.primary} />} onPress={addItem} />} />
      <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
        <SearchField value={query} onChangeText={setQuery} placeholder="Search items..." />
      </View>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: space.sm }} keyboardShouldPersistTaps="handled">
        <Card>
          {shown.length === 0 ? (
            <EmptyState
              icon={<Package size={24} color={colors.primary} />}
              title={q ? 'No items found' : 'No items yet'}
              body={q ? `Nothing matches "${query.trim()}".` : 'Add the things you sell to bill them quickly.'}
              actionLabel={q ? undefined : 'Add Item'}
              onAction={addItem}
            />
          ) : null}
          {shown.map((item, index) => (
            <View key={item.id}>
              {index > 0 ? <Divider inset={space.lg} /> : null}
              <CatalogItemRow item={item} taxRates={taxRates} showTax={itemWiseTax} onPress={() => router.push(`/items/${item.id}`)} />
            </View>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}
