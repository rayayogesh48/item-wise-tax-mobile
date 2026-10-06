import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Banknote, CalendarDays, ChevronRight, CirclePlus, Ellipsis, Plus, ShoppingBasket } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader, IconButton } from '@/components/AppHeader';
import { BottomSheet } from '@/components/BottomSheet';
import { ConfirmationSheet } from '@/components/ConfirmationSheet';
import { DiscountSheet } from '@/components/DiscountSheet';
import { EditInvoiceItemSheet } from '@/components/EditInvoiceItemSheet';
import { EmptyState } from '@/components/EmptyState';
import { InvoiceSummary } from '@/components/InvoiceSummary';
import { ItemCard } from '@/components/ItemCard';
import { ItemPickerSheet } from '@/components/ItemPickerSheet';
import { PaymentSelector } from '@/components/PaymentSelector';
import { InvoicePriceModeSelector } from '@/components/PriceModeSelectors';
import { Button, Card, Divider, Footer, KeyValue, Screen } from '@/components/primitives';
import { SettingsRow } from '@/components/SettingsRows';
import { TaxRatePicker } from '@/components/TaxRatePicker';
import { discountLabel, formatDate, invoiceNumber, invoicePriceModeLabel, parseNumber, taxLabel } from '@/domain/format';
import { buildSale } from '@/domain/sale';
import type { DraftLine, InvoicePriceMode, Item } from '@/domain/types';
import { CustomerPickerSheet } from '@/features/sales/CustomerPickerSheet';
import { useSaleDraft } from '@/features/sales/useSaleDraft';
import { newId, nextInvoiceNumber, showToast, useAppStore } from '@/store/useAppStore';
import { colors, fonts, radius, space, type } from '@/theme/tokens';

type Sheet = 'items' | 'customer' | 'priceMode' | 'discount' | 'billTax' | 'menu' | null;

const haptic = (run: () => Promise<void>) => {
  if (Platform.OS !== 'web') run().catch(() => undefined);
};

export default function NewSaleScreen() {
  const settings = useAppStore((s) => s.settings);
  const items = useAppStore((s) => s.items);
  const taxRates = useAppStore((s) => s.taxRates);
  const parties = useAppStore((s) => s.parties);
  const sales = useAppStore((s) => s.sales);
  const addSale = useAppStore((s) => s.addSale);

  const itemWiseTax = settings.itemWiseTaxEnabled;
  const ctx = useMemo(() => ({ itemWiseTax, taxRates }), [itemWiseTax, taxRates]);
  const { draft, patch, addItem, updateLine, removeLine, restoreLine, setPriceMode, reset, lines, totals, taxes } = useSaleDraft(settings, ctx);

  const [sheet, setSheet] = useState<Sheet>(null);
  const [editing, setEditing] = useState<DraftLine | null>(null);
  const [pendingMode, setPendingMode] = useState<InvoicePriceMode>(draft.priceMode);
  const [confirmMode, setConfirmMode] = useState<InvoicePriceMode | null>(null);
  const [receivedText, setReceivedText] = useState('');
  const scroll = useRef<ScrollView>(null);
  const today = useMemo(() => new Date().toISOString(), []);

  const number = nextInvoiceNumber(sales);
  const party = parties.find((p) => p.id === draft.partyId);
  const billTax = itemWiseTax ? null : (taxRates.find((r) => r.id === draft.billTaxRateId) ?? null);
  const received = parseNumber(receivedText);
  const canSave = draft.lines.length > 0 && !(draft.paymentType === 'partial' && received > totals.total);

  // If the per-invoice choice is switched off while this draft is open, fall back to Tax Extra.
  useEffect(() => {
    if (!settings.invoiceInclusiveExclusiveEnabled && draft.priceMode !== 'extra') setPriceMode('extra');
  }, [settings.invoiceInclusiveExclusiveEnabled, draft.priceMode, setPriceMode]);

  const recentIds = useMemo(() => [...new Set(sales.flatMap((s) => s.lines.map((l) => l.itemId)))], [sales]);
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const line of draft.lines) map[line.itemId] = (map[line.itemId] ?? 0) + line.quantity;
    return map;
  }, [draft.lines]);

  const selectItem = (item: Item) => {
    addItem(item);
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  };

  const remove = (line: DraftLine) => {
    const index = draft.lines.findIndex((l) => l.id === line.id);
    removeLine(line.id);
    showToast(`${line.name} removed`, 'Undo', () => restoreLine(line, index));
  };

  const applyPriceMode = () => {
    setSheet(null);
    if (pendingMode === draft.priceMode) return;
    if (draft.lines.length === 0) return setPriceMode(pendingMode);
    // Let the first sheet finish closing before the confirmation slides up.
    setTimeout(() => setConfirmMode(pendingMode), 260);
  };

  const save = (andNew: boolean) => {
    if (!canSave) return;
    const id = newId();
    addSale(buildSale({ ...draft, received }, ctx, { id, number, date: today, partyName: party?.name ?? 'Cash Sale' }));
    haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    showToast('Sale saved successfully.');
    if (andNew) {
      reset();
      setReceivedText('');
      scroll.current?.scrollTo({ y: 0, animated: true });
    } else {
      router.replace(`/sales/${id}`);
    }
  };

  return (
    <Screen>
      <AppHeader
        title="New Sale"
        right={
          <IconButton label="More options" onPress={() => setSheet('menu')}>
            <Ellipsis size={24} color={colors.text} />
          </IconButton>
        }
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Card style={styles.meta}>
            <View style={styles.metaCell}>
              <Text style={type.caption}>Invoice</Text>
              <Text style={type.body}>{invoiceNumber(number)}</Text>
            </View>
            <View style={styles.metaRule} />
            <View style={styles.metaCell}>
              <Text style={type.caption}>Date</Text>
              <View style={styles.inline}>
                <Text style={type.body}>{formatDate(today)}</Text>
                <CalendarDays size={18} color={colors.textSecondary} />
              </View>
            </View>
          </Card>

          <Card style={styles.party}>
            <View style={styles.avatar}><Banknote size={22} color={colors.onPrimary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={type.title} numberOfLines={1}>{party?.name ?? 'Cash Sale'}</Text>
              <Text style={type.bodySm}>{party ? (party.phone ?? 'Customer') : 'No customer selected'}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => setSheet('customer')} style={styles.pill}>
              {party ? null : <Plus size={16} color={colors.primary} />}
              <Text style={[type.bodySm, { color: colors.primary }]}>{party ? 'Change' : 'Select Customer'}</Text>
            </Pressable>
          </Card>

          <View style={{ gap: space.sm }}>
            <View style={styles.itemsHeader}>
              <Text style={type.headlineSm}>Items ({draft.lines.length})</Text>
              {settings.invoiceInclusiveExclusiveEnabled ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Prices: ${invoicePriceModeLabel[draft.priceMode]}. Change price type`}
                  onPress={() => {
                    setPendingMode(draft.priceMode);
                    setSheet('priceMode');
                  }}
                  hitSlop={8}
                  style={styles.inline}
                >
                  <Text style={type.bodySm}>Prices: <Text style={[type.titleSm, { color: colors.primary }]}>{invoicePriceModeLabel[draft.priceMode]}</Text></Text>
                  <ChevronRight size={18} color={colors.primary} />
                </Pressable>
              ) : null}
            </View>

            <Card>
              {draft.lines.length === 0 ? (
                <EmptyState icon={<ShoppingBasket size={24} color={colors.primary} />} title="No items yet" body="Add the items you are selling." />
              ) : null}
              {draft.lines.map((line, index) => (
                <View key={line.id}>
                  {index > 0 ? <Divider inset={space.md} /> : null}
                  <ItemCard
                    name={line.name}
                    quantity={line.quantity}
                    unit={line.unit}
                    rate={line.rate}
                    amounts={lines[index]}
                    mode={draft.priceMode}
                    discount={line.discount}
                    taxLabel={taxes[index] ? taxLabel(taxes[index]!) : null}
                    showTax={itemWiseTax}
                    onPress={() => setEditing(line)}
                    onRemove={() => remove(line)}
                  />
                </View>
              ))}
            </Card>

            <Button label="Add Item" variant="secondary" icon={<CirclePlus size={20} color={colors.primary} />} onPress={() => setSheet('items')} />
          </View>

          {draft.lines.length > 0 ? (
            <>
              <View style={styles.adjustments}>
                <Adjustment
                  label={draft.discount ? `Discount: ${discountLabel(draft.discount)}` : 'Add Discount'}
                  set={Boolean(draft.discount)}
                  onPress={() => setSheet('discount')}
                />
                {itemWiseTax ? null : (
                  <Adjustment label={billTax ? `Tax: ${taxLabel(billTax)}` : 'Add Tax'} set={Boolean(billTax)} onPress={() => setSheet('billTax')} />
                )}
              </View>

              <Card>
                <InvoiceSummary totals={totals} billTaxLabel={billTax ? taxLabel(billTax) : null} />
              </Card>

              <Card>
                <PaymentSelector
                  type={draft.paymentType}
                  onTypeChange={(paymentType) => patch({ paymentType })}
                  receivedText={receivedText}
                  onReceivedChange={setReceivedText}
                  total={totals.total}
                />
              </Card>

              <Card style={styles.notes}>
                <TextInput
                  accessibilityLabel="Notes or remarks"
                  value={draft.notes}
                  onChangeText={(notes) => patch({ notes })}
                  placeholder="Notes or Remarks"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  style={styles.notesInput}
                />
              </Card>
            </>
          ) : null}
        </ScrollView>

        <Footer>
          <Button label="Save & New" variant="secondary" disabled={!canSave} onPress={() => save(true)} style={{ flex: 1 }} />
          <Button label="Save Sale" disabled={!canSave} onPress={() => save(false)} style={{ flex: 1.4 }} />
        </Footer>
      </KeyboardAvoidingView>

      <ItemPickerSheet
        visible={sheet === 'items'}
        onClose={() => setSheet(null)}
        items={items}
        taxRates={taxRates}
        showTax={itemWiseTax}
        recentIds={recentIds}
        counts={counts}
        onSelect={selectItem}
      />

      <CustomerPickerSheet visible={sheet === 'customer'} onClose={() => setSheet(null)} parties={parties} value={draft.partyId} onChange={(partyId) => patch({ partyId })} />

      <BottomSheet
        visible={sheet === 'priceMode'}
        onClose={() => setSheet(null)}
        title="How are prices entered?"
        footer={<Button label="Apply" onPress={applyPriceMode} style={{ flex: 1 }} />}
      >
        <InvoicePriceModeSelector value={pendingMode} onChange={setPendingMode} />
      </BottomSheet>

      <ConfirmationSheet
        visible={confirmMode !== null}
        title="Change price type?"
        body="Existing item rates will be converted automatically."
        confirmLabel="Change"
        onCancel={() => setConfirmMode(null)}
        onConfirm={() => {
          if (confirmMode) setPriceMode(confirmMode);
          setConfirmMode(null);
        }}
      >
        <View style={styles.change}>
          <KeyValue label="Current" value={invoicePriceModeLabel[draft.priceMode]} />
          <KeyValue label="Change to" value={invoicePriceModeLabel[confirmMode ?? draft.priceMode]} />
        </View>
        <Text style={type.bodySm}>Totals stay the same. Saved item prices are not changed.</Text>
      </ConfirmationSheet>

      <DiscountSheet visible={sheet === 'discount'} onClose={() => setSheet(null)} value={draft.discount} amount={totals.subtotal} onApply={(discount) => patch({ discount })} />

      <TaxRatePicker
        visible={sheet === 'billTax'}
        onClose={() => setSheet(null)}
        title="Tax on this bill"
        taxRates={taxRates}
        value={draft.billTaxRateId}
        allowNoTax
        onChange={(billTaxRateId) => patch({ billTaxRateId })}
      />

      <BottomSheet visible={sheet === 'menu'} onClose={() => setSheet(null)} title="Invoice options">
        <View style={styles.menu}>
          <SettingsRow
            title="Tax & Pricing settings"
            subtitle="Item-wise tax and invoice price type"
            onPress={() => {
              setSheet(null);
              router.push('/settings/tax-pricing');
            }}
          />
          {draft.lines.length > 0 ? (
            <>
              <Divider inset={space.lg} />
              <SettingsRow
                title="Clear this invoice"
                subtitle="Remove all items and start again"
                onPress={() => {
                  setSheet(null);
                  reset();
                  setReceivedText('');
                }}
              />
            </>
          ) : null}
        </View>
      </BottomSheet>

      {editing ? (
        <EditInvoiceItemSheet
          key={editing.id}
          line={editing}
          mode={draft.priceMode}
          itemWiseTax={itemWiseTax}
          taxRates={taxRates}
          billTax={billTax}
          allowRateEntryMode={!settings.invoiceInclusiveExclusiveEnabled}
          onClose={() => setEditing(null)}
          onSave={updateLine}
        />
      ) : null}
    </Screen>
  );
}

function Adjustment({ label, set, onPress }: { label: string; set: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={6} style={({ pressed }) => [styles.adjustment, pressed && { opacity: 0.6 }]}>
      {set ? null : <Plus size={18} color={colors.primary} />}
      <Text style={[type.titleSm, { color: colors.primary }]}>{label}</Text>
      {set ? <ChevronRight size={18} color={colors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl },
  meta: { flexDirection: 'row', alignItems: 'stretch' },
  metaCell: { flex: 1, padding: space.md, gap: space.xs },
  metaRule: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  inline: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  party: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: space.xs, height: 36, paddingHorizontal: space.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  itemsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm, paddingHorizontal: space.xs, minHeight: 32 },
  adjustments: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', columnGap: space.xl, rowGap: space.xs, paddingHorizontal: space.xs },
  adjustment: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 40 },
  notes: { paddingHorizontal: space.lg, paddingVertical: space.md },
  notesInput: {
    minHeight: 24,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  change: { gap: space.sm, padding: space.md, borderRadius: radius.card, backgroundColor: colors.surfaceMuted },
  menu: { marginHorizontal: -space.lg, marginVertical: -space.lg },
});
