import { Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import type { Item, TaxRate } from '@/domain/types';
import { colors, fonts, radius, space, type } from '@/theme/tokens';

import { BottomSheet } from './BottomSheet';
import { CatalogItemRow } from './CatalogItemRow';
import { EmptyState } from './EmptyState';
import { Button, Divider } from './primitives';

type Props = {
  visible: boolean;
  onClose: () => void;
  items: Item[];
  taxRates: TaxRate[];
  showTax: boolean;
  /** Item ids from recent sales, most recent first. */
  recentIds: string[];
  /** How many of each item are already on the invoice. */
  counts: Record<string, number>;
  onSelect: (item: Item) => void;
};

export function SearchField({ value, onChangeText, placeholder }: { value: string; onChangeText: (text: string) => void; placeholder: string }) {
  return (
    <View style={styles.search}>
      <Search size={20} color={colors.textSecondary} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCorrect={false}
        returnKeyType="search"
        style={styles.searchInput}
      />
    </View>
  );
}

/** Full-height item search. Tapping an item adds it straight away using its saved price and tax. */
export function ItemPickerSheet({ visible, onClose, items, taxRates, showTax, recentIds, counts, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const added = Object.values(counts).reduce((a, b) => a + b, 0);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) return [{ title: 'Results', items: items.filter((i) => i.name.toLowerCase().includes(q)) }];
    const recent = recentIds.map((id) => items.find((i) => i.id === id)).filter((i): i is Item => Boolean(i));
    const rest = items.filter((i) => !recentIds.includes(i.id));
    return [
      { title: 'Recently Used', items: recent },
      { title: recent.length ? 'Other Items' : 'All Items', items: rest },
    ].filter((g) => g.items.length);
  }, [items, query, recentIds]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add Item"
      fullHeight
      header={<View style={styles.searchWrap}><SearchField value={query} onChangeText={setQuery} placeholder="Search items..." /></View>}
      footer={<Button label={added ? `Done · ${added} added` : 'Done'} onPress={onClose} style={{ flex: 1 }} />}
    >
      <View style={styles.list}>
        {groups.length === 0 ? (
          <EmptyState icon={<Search size={24} color={colors.primary} />} title="No items found" body={`Nothing matches "${query.trim()}".`} />
        ) : null}
        {groups.map((group) => (
          <View key={group.title}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.items.map((item, index) => (
              <View key={item.id}>
                {index > 0 ? <Divider inset={space.lg} /> : null}
                <CatalogItemRow item={item} taxRates={taxRates} showTax={showTax} badge={counts[item.id]} onPress={() => onSelect(item)} />
              </View>
            ))}
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.sm },
  search: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.card,
    backgroundColor: colors.surfaceMuted,
  },
  searchInput: {
    flex: 1,
    alignSelf: 'stretch',
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  // The sheet pads its content; rows here run edge to edge.
  list: { marginHorizontal: -space.lg, marginTop: -space.lg },
  groupTitle: { ...type.label, textTransform: 'uppercase', letterSpacing: 0.6, paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xs },
});
