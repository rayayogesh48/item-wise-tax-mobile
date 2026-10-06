import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '@/theme/tokens';

type Props = { title: string; description?: string; trailing?: string; selected: boolean; onPress: () => void };

/** Radio card. Selection is shown by the dot, the border and the tint, not colour alone. */
export function RadioOption({ title, description, trailing, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.option, selected && styles.selected]}
    >
      <View style={[styles.ring, selected && { borderColor: colors.primary }]}>{selected ? <View style={styles.dot} /> : null}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={type.title}>{title}</Text>
        {description ? <Text style={type.bodySm}>{description}</Text> : null}
      </View>
      {trailing ? <Text style={type.bodySm}>{trailing}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 56,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  ring: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.textDisabled, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
});
