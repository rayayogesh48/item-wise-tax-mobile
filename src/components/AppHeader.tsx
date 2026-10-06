import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, size, space, type } from '@/theme/tokens';

type Props = {
  title: string;
  /** Hide the back arrow on tab roots. */
  back?: boolean;
  onBack?: () => void;
  right?: ReactNode;
};

export function AppHeader({ title, back = true, onBack, right }: Props) {
  const insets = useSafeAreaInsets();
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        {back ? (
          <IconButton label="Back" onPress={goBack}>
            <ArrowLeft size={24} color={colors.text} />
          </IconButton>
        ) : (
          <View style={{ width: space.md }} />
        )}
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {right}
      </View>
    </View>
  );
}

export function IconButton({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: colors.surfaceMuted }]}
    >
      {children}
    </Pressable>
  );
}

/** Text action for the right side of the header, e.g. "+ Add Item". */
export function HeaderAction({ label, onPress, icon }: { label: string; onPress: () => void; icon?: ReactNode }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]}>
      {icon}
      <Text style={[type.titleSm, { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.bg },
  bar: { height: size.appBar, flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.xs },
  title: { ...type.headline, flex: 1 },
  iconButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  action: { flexDirection: 'row', alignItems: 'center', gap: space.xs, height: size.touch, paddingHorizontal: space.md },
});
