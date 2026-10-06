import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { ConfirmationSheet } from '@/components/ConfirmationSheet';
import { Screen } from '@/components/primitives';
import { SettingsRow, SettingsSection } from '@/components/SettingsRows';
import { invoicePriceModeLabel } from '@/domain/format';
import { showToast, useAppStore } from '@/store/useAppStore';
import { space } from '@/theme/tokens';

export default function SettingsScreen() {
  const settings = useAppStore((s) => s.settings);
  const resetDemoData = useAppStore((s) => s.resetDemoData);
  const [confirmReset, setConfirmReset] = useState(false);

  const summary = [
    `Item-wise tax ${settings.itemWiseTaxEnabled ? 'on' : 'off'}`,
    settings.invoiceInclusiveExclusiveEnabled ? `Invoices default to ${invoicePriceModeLabel[settings.defaultInvoicePriceMode]}` : 'Invoices use Tax Extra',
  ].join(' · ');

  return (
    <Screen>
      <AppHeader title="Settings" />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.xl }}>
        <SettingsSection title="Billing">
          <SettingsRow title="Tax & Pricing" subtitle={summary} onPress={() => router.push('/settings/tax-pricing')} />
        </SettingsSection>
        <SettingsSection title="Prototype">
          <SettingsRow title="Reset demo data" subtitle="Restore the sample items, parties and sales" onPress={() => setConfirmReset(true)} />
        </SettingsSection>
      </ScrollView>

      <ConfirmationSheet
        visible={confirmReset}
        title="Reset demo data?"
        body="Everything you added on this device, including saved sales and settings, will be replaced with the sample data."
        confirmLabel="Reset"
        destructive
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemoData();
          setConfirmReset(false);
          showToast('Demo data restored.');
        }}
      />
    </Screen>
  );
}
