import { View } from 'react-native';

import { UNITS } from '@/domain/seed';
import { space } from '@/theme/tokens';

import { BottomSheet } from './BottomSheet';
import { RadioOption } from './RadioOption';

type ListProps = { value: string; onChange: (unit: string) => void };

export function UnitList({ value, onChange }: ListProps) {
  const units = UNITS.includes(value) ? UNITS : [value, ...UNITS];
  return (
    <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
      {units.map((unit) => (
        <RadioOption key={unit} title={unit} selected={unit === value} onPress={() => onChange(unit)} />
      ))}
    </View>
  );
}

export function UnitPicker({ visible, onClose, value, onChange }: ListProps & { visible: boolean; onClose: () => void }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Select Unit">
      <UnitList
        value={value}
        onChange={(unit) => {
          onChange(unit);
          onClose();
        }}
      />
    </BottomSheet>
  );
}
