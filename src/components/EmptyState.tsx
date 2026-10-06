import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space, type } from '@/theme/tokens';

import { Button } from './primitives';

type Props = { icon: ReactNode; title: string; body?: string; actionLabel?: string; onAction?: () => void };

export function EmptyState({ icon, title, body, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>{icon}</View>
      <Text style={[type.title, { textAlign: 'center' }]}>{title}</Text>
      {body ? <Text style={[type.bodySm, { textAlign: 'center' }]}>{body}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} variant="secondary" onPress={onAction} style={{ marginTop: space.sm }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.xs, paddingVertical: space.xxl, paddingHorizontal: space.xl },
  icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
});
