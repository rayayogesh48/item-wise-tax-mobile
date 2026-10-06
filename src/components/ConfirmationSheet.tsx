import type { ReactNode } from 'react';
import { Text } from 'react-native';

import { type } from '@/theme/tokens';

import { BottomSheet } from './BottomSheet';
import { Button } from './primitives';

type Props = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
};

export function ConfirmationSheet({ visible, title, body, confirmLabel, cancelLabel = 'Cancel', destructive, onConfirm, onCancel, children }: Props) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button label={cancelLabel} variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
          <Button label={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} style={{ flex: 1 }} />
        </>
      }
    >
      <Text style={[type.body, { fontSize: 15 }]}>{body}</Text>
      {children}
    </BottomSheet>
  );
}
