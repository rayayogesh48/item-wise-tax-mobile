import { ArrowLeft, X } from 'lucide-react-native';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, sheetShadow, size, space, type } from '@/theme/tokens';

import { IconButton } from './AppHeader';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Shows a back arrow instead of the close button, for sub-views inside one sheet. */
  onBack?: () => void;
  footer?: ReactNode;
  fullHeight?: boolean;
  /** Rendered above the scroll area, e.g. a search field. */
  header?: ReactNode;
  children: ReactNode;
};

const OUT_MS = 200;

/**
 * For sheets that are mounted only while in use (so their form state starts fresh):
 * opens on mount and lets the slide-out finish before telling the parent to unmount.
 */
export function useMountedSheet(onClosed: () => void) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 0);
    return () => clearTimeout(timer);
  }, []);
  const close = useCallback(() => {
    setOpen(false);
    setTimeout(onClosed, OUT_MS + 20);
  }, [onClosed]);
  return { open, close };
}

export function BottomSheet({ visible, onClose, title, onBack, footer, fullHeight, header, children }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);

  // Mount as soon as it is asked to show; unmounting waits for the slide-out below.
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      progress.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
      return;
    }
    progress.value = withTiming(0, { duration: OUT_MS, easing: Easing.in(Easing.cubic) });
    const timer = setTimeout(() => setMounted(false), OUT_MS);
    return () => clearTimeout(timer);
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * height }] }));

  if (!mounted) return null;
  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onBack ?? onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[styles.sheet, fullHeight ? { height: height * 0.92 } : { maxHeight: height * 0.9 }, sheetStyle]}
        >
          <View style={styles.header}>
            {onBack ? (
              <IconButton label="Back" onPress={onBack}>
                <ArrowLeft size={22} color={colors.text} />
              </IconButton>
            ) : null}
            <Text style={[type.headline, styles.title, onBack ? null : { marginLeft: space.lg }]} accessibilityRole="header">
              {title}
            </Text>
            <IconButton label="Close" onPress={onClose}>
              <X size={22} color={colors.textSecondary} />
            </IconButton>
          </View>
          {header}
          <ScrollView
            style={fullHeight ? { flex: 1 } : { flexGrow: 0 }}
            contentContainerStyle={[styles.content, !footer && { paddingBottom: space.lg + insets.bottom }]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {footer ? <View style={[styles.footer, { paddingBottom: space.lg + insets.bottom }]}>{footer}</View> : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: colors.overlay },
  sheet: {
    width: '100%',
    maxWidth: size.maxWidth,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    overflow: 'hidden',
    ...sheetShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    paddingHorizontal: space.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { flex: 1 },
  content: { padding: space.lg, gap: space.lg },
  footer: {
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
