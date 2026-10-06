import { View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { RadioOption } from '@/components/RadioOption';
import type { Party } from '@/domain/types';
import { space } from '@/theme/tokens';

type Props = { visible: boolean; onClose: () => void; parties: Party[]; value: string | null; onChange: (partyId: string | null) => void };

export function CustomerPickerSheet({ visible, onClose, parties, value, onChange }: Props) {
  const pick = (id: string | null) => {
    onChange(id);
    onClose();
  };
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Select Customer">
      <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
        <RadioOption title="Cash Sale" description="No customer on this invoice" selected={value === null} onPress={() => pick(null)} />
        {parties.map((party) => (
          <RadioOption key={party.id} title={party.name} description={party.phone} selected={value === party.id} onPress={() => pick(party.id)} />
        ))}
      </View>
    </BottomSheet>
  );
}
