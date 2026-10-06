import { Minus, Plus } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatQuantity, parseNumber } from '@/domain/format';
import { colors, fonts, radius, space, type } from '@/theme/tokens';

import { sanitizeDecimal } from './MoneyInput';

type Props = { value: string; onChange: (text: string) => void; unit?: string };

export function QuantityStepper({ value, onChange, unit }: Props) {
  const quantity = parseNumber(value);
  const step = (delta: number) => onChange(formatQuantity(Math.max(quantity + delta, 1)));
  return (
    <View style={styles.row}>
      <Text style={[type.title, { flex: 1 }]}>Quantity{unit ? <Text style={type.bodySm}>{`  ${unit}`}</Text> : null}</Text>
      <View style={styles.stepper}>
        <StepButton label="Decrease quantity" disabled={quantity <= 1} onPress={() => step(-1)}>
          <Minus size={20} color={quantity <= 1 ? colors.textDisabled : colors.text} />
        </StepButton>
        <TextInput
          accessibilityLabel="Quantity"
          value={value}
          onChangeText={(text) => onChange(sanitizeDecimal(text))}
          onBlur={() => quantity <= 0 && onChange('1')}
          keyboardType="decimal-pad"
          inputMode="decimal"
          selectTextOnFocus
          style={styles.input}
        />
        <StepButton label="Increase quantity" onPress={() => step(1)}>
          <Plus size={20} color={colors.text} />
        </StepButton>
      </View>
    </View>
  );
}

function StepButton({ label, onPress, disabled, children }: { label: string; onPress: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && { backgroundColor: colors.surfaceMuted }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, height: 48 },
  button: { width: 48, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radius.card },
  input: {
    width: 64,
    height: 46,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.text,
    padding: 0,
    fontVariant: ['tabular-nums'],
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
});
