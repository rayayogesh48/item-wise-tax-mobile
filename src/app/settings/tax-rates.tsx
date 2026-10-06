import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { AppHeader, HeaderAction } from '@/components/AppHeader';
import { BottomSheet, useMountedSheet } from '@/components/BottomSheet';
import { TextField } from '@/components/Field';
import { MoneyInput } from '@/components/MoneyInput';
import { Button, Card, Divider, Screen } from '@/components/primitives';
import { parseNumber, taxLabel } from '@/domain/format';
import type { TaxRate } from '@/domain/types';
import { isTaxRateUsed, showToast, useAppStore } from '@/store/useAppStore';
import { colors, space, type } from '@/theme/tokens';

export default function TaxRatesScreen() {
  const taxRates = useAppStore((s) => s.taxRates);
  const items = useAppStore((s) => s.items);
  const sales = useAppStore((s) => s.sales);
  /** 'new', or the rate being edited */
  const [editing, setEditing] = useState<TaxRate | 'new' | null>(null);

  return (
    <Screen>
      <AppHeader title="Manage Tax Rates" right={<HeaderAction label="Add" icon={<Plus size={18} color={colors.primary} />} onPress={() => setEditing('new')} />} />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
        <Card>
          {taxRates.map((rate, index) => {
            const used = isTaxRateUsed(rate.id, items, sales);
            const status = rate.kind === 'system' ? 'System' : used ? 'Custom · In use' : 'Custom';
            return (
              <View key={rate.id}>
                {index > 0 ? <Divider inset={space.lg} /> : null}
                <Pressable
                  accessibilityRole="button"
                  disabled={rate.kind === 'system'}
                  onPress={() => setEditing(rate)}
                  style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={type.title}>{rate.name || `${rate.rate}%`}</Text>
                    <Text style={type.bodySm}>{status}</Text>
                  </View>
                  <Text style={[type.title, type.money]}>{rate.rate}%</Text>
                </Pressable>
              </View>
            );
          })}
        </Card>
        <Button label="Add Tax Rate" variant="secondary" icon={<Plus size={20} color={colors.text} />} onPress={() => setEditing('new')} />
        <Text style={[type.bodySm, { paddingHorizontal: space.xs }]}>
          A tax rate that is used by an item or a saved sale cannot be deleted, so old invoices stay correct.
        </Text>
      </ScrollView>

      {editing ? (
        <TaxRateSheet
          key={editing === 'new' ? 'new' : editing.id}
          rate={editing === 'new' ? null : editing}
          used={editing !== 'new' && isTaxRateUsed(editing.id, items, sales)}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </Screen>
  );
}

const schema = z.object({
  rate: z.string().refine((v) => v !== '' && parseNumber(v) > 0 && parseNumber(v) <= 100, 'Enter a rate between 0 and 100.'),
  name: z.string().trim().max(20, 'Keep the label under 20 characters.'),
});

function TaxRateSheet({ rate, used, onClose }: { rate: TaxRate | null; used: boolean; onClose: () => void }) {
  const { open, close } = useMountedSheet(onClose);
  const taxRates = useAppStore((s) => s.taxRates);
  const addTaxRate = useAppStore((s) => s.addTaxRate);
  const updateTaxRate = useAppStore((s) => s.updateTaxRate);
  const deleteTaxRate = useAppStore((s) => s.deleteTaxRate);
  const { control, handleSubmit, setError } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { rate: rate ? String(rate.rate) : '', name: rate?.name ?? '' },
  });

  const save = handleSubmit((form) => {
    const next = { rate: parseNumber(form.rate), name: form.name.trim() };
    const duplicate = taxRates.some((r) => r.id !== rate?.id && taxLabel(r) === taxLabel(next));
    if (duplicate) return setError('rate', { message: `${taxLabel(next)} already exists.` });
    if (rate) updateTaxRate(rate.id, next);
    else addTaxRate(next);
    showToast(rate ? 'Tax rate updated.' : 'Tax rate added.');
    close();
  });

  return (
    <BottomSheet
      visible={open}
      onClose={close}
      title={rate ? 'Edit Tax Rate' : 'Add Tax Rate'}
      footer={
        <>
          {rate ? (
            <Button
              label="Delete"
              variant="danger"
              disabled={used}
              onPress={() => {
                deleteTaxRate(rate.id);
                showToast('Tax rate deleted.');
                close();
              }}
              style={{ flex: 1 }}
            />
          ) : null}
          <Button label="Save" disabled={used} onPress={save} style={{ flex: 1 }} />
        </>
      }
    >
      <View style={{ gap: space.xl, paddingTop: space.sm }}>
        {used ? (
          <Text style={type.bodySm}>Used tax rate. It is on an item or a saved sale, so it cannot be edited or deleted.</Text>
        ) : null}
        <Controller
          control={control}
          name="rate"
          render={({ field, fieldState }) => (
            <MoneyInput label="Rate (%)" prefix="%" placeholder="5" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} autoFocus={!rate} />
          )}
        />
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <TextField label="Label" placeholder="GST / Service Tax / optional" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
          )}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, minHeight: 64 },
});
