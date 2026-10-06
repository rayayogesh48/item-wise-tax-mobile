import { ChevronRight } from 'lucide-react-native';
import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { colors, space, type } from '@/theme/tokens';

import { Card, Divider, SectionLabel } from './primitives';

/** A titled group of settings rows inside one card. */
export function SettingsSection({ title, children }: { title?: string; children: ReactNode }) {
  const rows = Children.toArray(children);
  return (
    <View>
      {title ? <SectionLabel>{title}</SectionLabel> : null}
      <Card>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? <Divider inset={space.lg} /> : null}
            {row}
          </Fragment>
        ))}
      </Card>
    </View>
  );
}

type RowProps = { title: string; subtitle?: string; value?: string; icon?: ReactNode; onPress?: () => void; disabled?: boolean };

/** Drill-down row: title, optional supporting text, chevron. */
export function SettingsRow({ title, subtitle, value, icon, onPress, disabled }: RowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }, disabled && { opacity: 0.45 }]}
    >
      {icon}
      <View style={styles.text}>
        <Text style={type.title}>{title}</Text>
        {subtitle ? <Text style={type.bodySm}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={type.bodySm}>{value}</Text> : null}
      {onPress ? <ChevronRight size={20} color={colors.textSecondary} /> : null}
    </Pressable>
  );
}

type ToggleProps = { title: string; helper?: string; value: boolean; onValueChange: (value: boolean) => void };

export function ToggleRow({ title, helper, value, onValueChange }: ToggleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={type.title}>{title}</Text>
        {helper ? <Text style={type.bodySm}>{helper}</Text> : null}
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#d9d6de', true: colors.primary }}
        thumbColor="#ffffff"
        ios_backgroundColor="#d9d6de"
        {...({ activeThumbColor: '#ffffff' } as object)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: 14, minHeight: 56 },
  text: { flex: 1, gap: 2 },
});
