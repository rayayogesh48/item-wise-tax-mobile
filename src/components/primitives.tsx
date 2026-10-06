import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cardShadow, colors, fonts, radius, size, space, type } from '@/theme/tokens';

export function Screen({ children }: { children: ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={[styles.divider, { marginLeft: inset }]} />;
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', disabled, icon, style }: ButtonProps) {
  const tone = variant === 'primary' ? colors.onPrimary : variant === 'danger' ? colors.danger : variant === 'ghost' ? colors.primary : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: pressed ? colors.primaryPressed : colors.primary },
        (variant === 'secondary' || variant === 'danger') && styles.buttonOutline,
        variant !== 'primary' && pressed && { backgroundColor: colors.surfaceMuted },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.buttonLabel, { color: tone }]}>{label}</Text>
    </Pressable>
  );
}

/** Sticky action area at the bottom of a screen. */
export function Footer({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.footer, { paddingBottom: space.lg + insets.bottom }]}>{children}</View>;
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

/** Label on the left, value on the right. */
export function KeyValue({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <View style={styles.keyValue}>
      <Text style={strong ? type.title : type.bodySm}>{label}</Text>
      <Text style={[strong ? type.title : type.titleSm, type.money, muted && { color: colors.textSecondary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, ...cardShadow },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, alignSelf: 'stretch' },
  button: {
    height: size.button,
    borderRadius: radius.card,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutline: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  buttonLabel: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24 },
  footer: {
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  sectionLabel: { ...type.label, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: space.sm, marginLeft: space.xs },
  keyValue: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
});
