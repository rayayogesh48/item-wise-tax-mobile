import { CircleCheck } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToastStore } from '@/store/useAppStore';
import { colors, fonts, radius, size, space } from '@/theme/tokens';

/** App-wide toast / snackbar. An optional action (e.g. Undo) keeps it up a little longer. */
export function SuccessToast() {
  const insets = useSafeAreaInsets();
  const toast = useToastStore((s) => s.toast);
  const hide = useToastStore((s) => s.hide);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(hide, toast.onAction ? 5000 : 2600);
    return () => clearTimeout(timer);
  }, [toast, hide]);

  if (!toast) return null;
  return (
    <Animated.View
      key={toast.id}
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(180)}
      accessibilityLiveRegion="polite"
      style={[styles.toast, { bottom: insets.bottom + 96 }]}
    >
      {toast.onAction ? null : <CircleCheck size={20} color={colors.primary} />}
      <Text style={styles.message}>{toast.message}</Text>
      {toast.onAction ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => {
            toast.onAction?.();
            hide();
          }}
        >
          <Text style={styles.action}>{toast.actionLabel}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    maxWidth: size.maxWidth - space.lg * 2,
    alignSelf: 'center',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.toast,
  },
  message: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: '#ffffff' },
  action: { fontFamily: fonts.semibold, fontSize: 14, color: '#6fe0b8' },
});
