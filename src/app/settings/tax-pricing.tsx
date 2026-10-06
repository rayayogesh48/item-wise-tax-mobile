import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { BottomSheet } from '@/components/BottomSheet';
import { ConfirmationSheet } from '@/components/ConfirmationSheet';
import { InvoicePriceModeSelector } from '@/components/PriceModeSelectors';
import { Screen } from '@/components/primitives';
import { SettingsRow, SettingsSection, ToggleRow } from '@/components/SettingsRows';
import { invoicePriceModeLabel, taxLabel } from '@/domain/format';
import { useAppStore } from '@/store/useAppStore';
import { space, type } from '@/theme/tokens';

/** Two independent settings: tax per inventory item, and the per-invoice Tax Included / Tax Extra choice. */
export default function TaxPricingScreen() {
  const settings = useAppStore((s) => s.settings);
  const taxRates = useAppStore((s) => s.taxRates);
  const update = useAppStore((s) => s.updateSettings);
  const [confirmItemTax, setConfirmItemTax] = useState(false);
  const [choosingDefault, setChoosingDefault] = useState(false);

  return (
    <Screen>
      <AppHeader title="Tax & Pricing" />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.xl }}>
        <SettingsSection title="Item tax">
          <ToggleRow
            title="Item-wise tax for inventory"
            helper="Set tax rates and tax-inclusive prices for individual items."
            value={settings.itemWiseTaxEnabled}
            onValueChange={(on) => (on ? setConfirmItemTax(true) : update({ itemWiseTaxEnabled: false }))}
          />
          {settings.itemWiseTaxEnabled ? (
            <SettingsRow title="Manage Tax Rates" subtitle={taxRates.map(taxLabel).join(', ')} onPress={() => router.push('/settings/tax-rates')} />
          ) : null}
        </SettingsSection>

        <SettingsSection title="Invoice pricing">
          <ToggleRow
            title="Allow inclusive/exclusive tax for invoice"
            helper="Choose whether invoice rates include tax or tax is added separately."
            value={settings.invoiceInclusiveExclusiveEnabled}
            onValueChange={(on) => update({ invoiceInclusiveExclusiveEnabled: on })}
          />
          {settings.invoiceInclusiveExclusiveEnabled ? (
            <SettingsRow
              title="Default Invoice Price Type"
              subtitle={invoicePriceModeLabel[settings.defaultInvoicePriceMode]}
              onPress={() => setChoosingDefault(true)}
            />
          ) : null}
        </SettingsSection>

        <Text style={[type.bodySm, { paddingHorizontal: space.xs }]}>
          {settings.invoiceInclusiveExclusiveEnabled
            ? 'New invoices show a Price Type control: Tax Included or Tax Extra.'
            : 'New invoices use Tax Extra: Rate is the price before tax, and tax is shown separately.'}{' '}
          Invoices you have already saved are never changed by these settings.
        </Text>
      </ScrollView>

      <ConfirmationSheet
        visible={confirmItemTax}
        title="Enable item-wise tax?"
        body="You'll be able to assign tax rates and With Tax / Without Tax pricing to inventory items."
        confirmLabel="Enable"
        onCancel={() => setConfirmItemTax(false)}
        onConfirm={() => {
          update({ itemWiseTaxEnabled: true });
          setConfirmItemTax(false);
        }}
      />

      <BottomSheet visible={choosingDefault} onClose={() => setChoosingDefault(false)} title="Default Invoice Price Type">
        <Text style={type.bodySm}>Used automatically when creating a new invoice. You can still change it on the invoice.</Text>
        <InvoicePriceModeSelector
          value={settings.defaultInvoicePriceMode}
          onChange={(mode) => {
            update({ defaultInvoicePriceMode: mode });
            setChoosingDefault(false);
          }}
        />
      </BottomSheet>
    </Screen>
  );
}
