import { ChevronRight } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius, size, space, type } from '@/theme/tokens';

type ShellProps = { label: string; focused?: boolean; error?: string; helper?: string; children: ReactNode };

/** Outlined 48px field with the label sitting on the border, as in the Karobar design file. */
function FieldShell({ label, focused, error, helper, children }: ShellProps) {
  return (
    <View>
      <View style={[styles.box, focused && styles.boxFocused, error ? styles.boxError : null]}>
        <Text style={[styles.label, focused && { color: colors.primary }, error ? { color: colors.danger } : null]}>{label}</Text>
        {children}
      </View>
      {error || helper ? <Text style={[styles.helper, error ? { color: colors.danger } : null]}>{error || helper}</Text> : null}
    </View>
  );
}

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  helper?: string;
  prefix?: string;
  suffix?: ReactNode;
};

export function TextField({ label, error, helper, prefix, suffix, onFocus, onBlur, ...input }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <FieldShell label={label} focused={focused} error={error} helper={helper}>
      {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textDisabled}
        selectionColor={colors.primary}
        {...input}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={styles.input}
      />
      {suffix}
    </FieldShell>
  );
}

/** A field that opens a picker instead of the keyboard. */
export function SelectField({ label, value, placeholder, onPress, helper }: { label: string; value?: string; placeholder?: string; onPress: () => void; helper?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value ?? placeholder ?? ''}`} onPress={onPress}>
      <FieldShell label={label} helper={helper}>
        <Text style={[styles.input, styles.selectValue, !value && { color: colors.textDisabled }]} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
        <ChevronRight size={20} color={colors.textSecondary} />
      </FieldShell>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    height: size.field,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  boxFocused: { borderColor: colors.primary },
  boxError: { borderColor: colors.danger },
  label: { ...type.caption, color: colors.text, position: 'absolute', top: -9, left: space.md, paddingHorizontal: space.xs, backgroundColor: colors.surface },
  prefix: { ...type.body, color: colors.textSecondary },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  selectValue: { lineHeight: 46 },
  helper: { ...type.caption, marginTop: space.xs, marginLeft: space.xs },
});
