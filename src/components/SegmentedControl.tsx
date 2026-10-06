import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cardShadow, colors, radius, space, type } from '@/theme/tokens';

type Props<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
};

export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: Props<T>) {
  return (
    <View style={styles.track} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.selected]}
          >
            <Text style={[type.titleSm, !selected && { color: colors.textSecondary }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: radius.card, padding: space.xs, gap: space.xs },
  segment: { flex: 1, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: colors.surface, ...cardShadow },
});
