import type { ReactNode } from 'react';

import { TextField } from './Field';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helper?: string;
  prefix?: string;
  suffix?: ReactNode;
  autoFocus?: boolean;
  placeholder?: string;
};

/** Keeps only digits and a single decimal point with up to 2 decimals. */
export function sanitizeDecimal(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const [integer, ...rest] = cleaned.split('.');
  return rest.length ? `${integer}.${rest.join('').slice(0, 2)}` : integer;
}

/** Money field with the numeric keypad. Values stay as text while typing; parse on use. */
export function MoneyInput({ onChangeText, prefix = 'Rs.', placeholder = '0', ...props }: Props) {
  return (
    <TextField
      {...props}
      prefix={prefix}
      placeholder={placeholder}
      keyboardType="decimal-pad"
      inputMode="decimal"
      selectTextOnFocus
      onChangeText={(text) => onChangeText(sanitizeDecimal(text))}
    />
  );
}
