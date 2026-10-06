import { Text, View } from 'react-native';

import { calculatePayment } from '@/domain/calc';
import { formatMoney, parseNumber } from '@/domain/format';
import type { PaymentType } from '@/domain/types';
import { colors, space, type } from '@/theme/tokens';

import { MoneyInput } from './MoneyInput';
import { KeyValue } from './primitives';
import { SegmentedControl } from './SegmentedControl';

const options = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit', label: 'Credit' },
  { value: 'partial', label: 'Partial' },
] as const;

type Props = {
  type: PaymentType;
  onTypeChange: (type: PaymentType) => void;
  receivedText: string;
  onReceivedChange: (text: string) => void;
  total: number;
};

export function PaymentSelector({ type: paymentType, onTypeChange, receivedText, onReceivedChange, total }: Props) {
  const entered = parseNumber(receivedText);
  const { received, due } = calculatePayment(paymentType, total, entered);
  const tooMuch = paymentType === 'partial' && entered > total;
  return (
    <View style={{ padding: space.md, gap: space.md }}>
      <Text style={type.headlineSm}>Payment</Text>
      <SegmentedControl options={options} value={paymentType} onChange={onTypeChange} accessibilityLabel="Payment type" />
      {paymentType === 'partial' ? (
        <View style={{ marginTop: space.xs }}>
          <MoneyInput
            label="Received"
            value={receivedText}
            onChangeText={onReceivedChange}
            error={tooMuch ? `Received amount cannot be more than ${formatMoney(total)}.` : undefined}
          />
        </View>
      ) : (
        <KeyValue label="Received" value={formatMoney(received)} />
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[type.bodySm, due > 0 && { color: colors.danger }]}>Balance Due</Text>
        <Text style={[type.titleSm, type.money, due > 0 && { color: colors.danger }]}>{formatMoney(due)}</Text>
      </View>
    </View>
  );
}
