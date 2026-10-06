import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { AppHeader } from '@/components/AppHeader';
import { SelectField, TextField } from '@/components/Field';
import { MoneyInput, sanitizeDecimal } from '@/components/MoneyInput';
import { PriceBreakdown } from '@/components/PriceBreakdown';
import { SavedPriceModeSelector } from '@/components/PriceModeSelectors';
import { Button, Card, Footer, Screen, SectionLabel } from '@/components/primitives';
import { TaxRatePicker, taxRateName } from '@/components/TaxRatePicker';
import { UnitPicker } from '@/components/UnitPicker';
import { formatNumberInput, parseNumber } from '@/domain/format';
import type { Item } from '@/domain/types';
import { showToast, useAppStore } from '@/store/useAppStore';
import { space } from '@/theme/tokens';

const schema = z.object({
  name: z.string().trim().min(1, 'Enter an item name.'),
  unit: z.string().min(1),
  sku: z.string(),
  category: z.string(),
  salesPrice: z.string().refine((v) => parseNumber(v) > 0, 'Enter a sales price.'),
  salesPriceMode: z.enum(['with_tax', 'without_tax']),
  taxRateId: z.string(),
  stock: z.string(),
});

type FormValues = z.infer<typeof schema>;

/** Add / Edit Item. Tax controls exist only while item-wise tax is on; they are removed, not disabled. */
export function ItemForm({ item }: { item?: Item }) {
  const itemWiseTax = useAppStore((s) => s.settings.itemWiseTaxEnabled);
  const taxRates = useAppStore((s) => s.taxRates);
  const saveItem = useAppStore((s) => s.saveItem);
  const [picker, setPicker] = useState<'unit' | 'tax' | null>(null);

  const { control, handleSubmit, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name ?? '',
      unit: item?.unit ?? 'Pc',
      sku: item?.sku ?? '',
      category: item?.category ?? '',
      salesPrice: item ? formatNumberInput(item.salesPrice) : '',
      salesPriceMode: item?.salesPriceMode ?? 'without_tax',
      // New items start on VAT 13% when tax is per item, otherwise untaxed.
      taxRateId: item?.taxRateId ?? (itemWiseTax ? 'vat13' : 'exempt'),
      stock: item?.stock != null ? formatNumberInput(item.stock) : '',
    },
  });

  const values = watch();
  const price = parseNumber(values.salesPrice);
  const taxRate = taxRates.find((r) => r.id === values.taxRateId);
  const tracksStock = values.unit !== 'Service';

  const submit = handleSubmit((form) => {
    saveItem({
      id: item?.id,
      name: form.name.trim(),
      unit: form.unit,
      sku: form.sku.trim() || undefined,
      category: form.category.trim() || undefined,
      // Saved exactly as typed. Switching With Tax / Without Tax only changes what the number means.
      salesPrice: parseNumber(form.salesPrice),
      salesPriceMode: form.salesPriceMode,
      taxRateId: form.taxRateId,
      stock: tracksStock ? parseNumber(form.stock) : null,
    });
    showToast(item ? 'Item updated.' : 'Item added.');
    if (router.canGoBack()) router.back();
    else router.replace('/items');
  });

  return (
    <Screen>
      <AppHeader title={item ? 'Edit Item' : 'Add Item'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View>
            <SectionLabel>Item Details</SectionLabel>
            <Card style={styles.card}>
              <Controller
                control={control}
                name="name"
                render={({ field, fieldState }) => (
                  <TextField label="Item Name" placeholder="MacBook Air M3" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} autoFocus={!item} />
                )}
              />
              <SelectField label="Unit" value={values.unit} onPress={() => setPicker('unit')} />
              <View style={styles.pair}>
                <View style={{ flex: 1 }}>
                  <Controller control={control} name="sku" render={({ field }) => <TextField label="SKU" placeholder="Optional" value={field.value} onChangeText={field.onChange} autoCapitalize="characters" />} />
                </View>
                <View style={{ flex: 1 }}>
                  <Controller control={control} name="category" render={({ field }) => <TextField label="Category" placeholder="Optional" value={field.value} onChangeText={field.onChange} />} />
                </View>
              </View>
            </Card>
          </View>

          <View>
            <SectionLabel>Pricing</SectionLabel>
            <Card style={styles.card}>
              <Controller
                control={control}
                name="salesPrice"
                render={({ field, fieldState }) => <MoneyInput label="Sales Price" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />}
              />
              {itemWiseTax ? <SavedPriceModeSelector value={values.salesPriceMode} onChange={(mode) => setValue('salesPriceMode', mode)} /> : null}
            </Card>
          </View>

          {itemWiseTax ? (
            <View>
              <SectionLabel>Tax</SectionLabel>
              <Card style={styles.card}>
                <SelectField label="Tax Rate" value={taxRateName(taxRates, values.taxRateId)} onPress={() => setPicker('tax')} />
                {price > 0 && taxRate ? <PriceBreakdown price={price} mode={values.salesPriceMode} taxRate={taxRate.rate} /> : null}
              </Card>
            </View>
          ) : null}

          {tracksStock ? (
            <View>
              <SectionLabel>Stock</SectionLabel>
              <Card style={styles.card}>
                <Controller
                  control={control}
                  name="stock"
                  render={({ field }) => (
                    <MoneyInput label={item ? 'Stock' : 'Opening Stock'} prefix="" value={field.value} onChangeText={(text) => field.onChange(sanitizeDecimal(text))} helper={`In ${values.unit}`} />
                  )}
                />
              </Card>
            </View>
          ) : null}
        </ScrollView>
        <Footer>
          <Button label={item ? 'Save Changes' : 'Save Item'} onPress={submit} style={{ flex: 1 }} />
        </Footer>
      </KeyboardAvoidingView>

      <UnitPicker visible={picker === 'unit'} onClose={() => setPicker(null)} value={values.unit} onChange={(unit) => setValue('unit', unit)} />
      <TaxRatePicker visible={picker === 'tax'} onClose={() => setPicker(null)} taxRates={taxRates} value={values.taxRateId} onChange={(id) => id && setValue('taxRateId', id)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.xl },
  card: { padding: space.lg, paddingTop: space.xl, gap: space.xl },
  pair: { flexDirection: 'row', gap: space.md },
});
