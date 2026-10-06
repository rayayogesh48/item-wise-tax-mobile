import { Plus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader, HeaderAction } from '@/components/AppHeader';
import { BottomSheet } from '@/components/BottomSheet';
import { EmptyState } from '@/components/EmptyState';
import { TextField } from '@/components/Field';
import { Button, Card, Divider, Screen } from '@/components/primitives';
import { formatMoney } from '@/domain/format';
import { showToast, useAppStore } from '@/store/useAppStore';
import { colors, fonts, space, type } from '@/theme/tokens';

export default function PartiesScreen() {
  const parties = useAppStore((s) => s.parties);
  const sales = useAppStore((s) => s.sales);
  const addParty = useAppStore((s) => s.addParty);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();

  const open = () => {
    setName('');
    setPhone('');
    setError(undefined);
    setAdding(true);
  };
  const save = () => {
    if (!name.trim()) return setError('Enter a party name.');
    addParty({ name: name.trim(), phone: phone.trim() || undefined });
    setAdding(false);
    showToast('Party added.');
  };

  return (
    <Screen>
      <AppHeader title="Parties" back={false} right={<HeaderAction label="Add Party" icon={<Plus size={18} color={colors.primary} />} onPress={open} />} />
      <ScrollView contentContainerStyle={{ padding: space.lg }}>
        <Card>
          {parties.length === 0 ? (
            <EmptyState icon={<Users size={24} color={colors.primary} />} title="No parties yet" body="Add customers to sell on credit and track what they owe." actionLabel="Add Party" onAction={open} />
          ) : null}
          {parties.map((party, index) => {
            const due = sales.filter((s) => s.partyId === party.id).reduce((a, s) => a + s.payment.due, 0);
            return (
              <View key={party.id}>
                {index > 0 ? <Divider inset={space.lg} /> : null}
                <View style={styles.row}>
                  <View style={styles.avatar}><Text style={styles.initial}>{party.name.charAt(0).toUpperCase()}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={type.title} numberOfLines={1}>{party.name}</Text>
                    {party.phone ? <Text style={type.bodySm}>{party.phone}</Text> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[type.titleSm, type.money, due > 0 && { color: colors.danger }]}>{formatMoney(due, { compact: true })}</Text>
                    <Text style={type.caption}>{due > 0 ? 'To receive' : 'Settled'}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </Card>
      </ScrollView>

      <BottomSheet visible={adding} onClose={() => setAdding(false)} title="Add Party" footer={<Button label="Save" onPress={save} style={{ flex: 1 }} />}>
        <View style={{ gap: space.xl, paddingTop: space.sm }}>
          <TextField label="Party Name" value={name} onChangeText={(t) => { setName(t); setError(undefined); }} error={error} autoFocus />
          <TextField label="Phone" placeholder="Optional" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: fonts.semibold, fontSize: 16, color: colors.primaryPressed },
});
