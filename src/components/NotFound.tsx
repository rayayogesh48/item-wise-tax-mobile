import { router } from 'expo-router';
import { SearchX } from 'lucide-react-native';

import { colors } from '@/theme/tokens';

import { AppHeader } from './AppHeader';
import { EmptyState } from './EmptyState';
import { Screen } from './primitives';

/** Error state for a detail screen whose record is missing. */
export function NotFound({ title, message }: { title: string; message: string }) {
  return (
    <Screen>
      <AppHeader title={title} />
      <EmptyState icon={<SearchX size={24} color={colors.primary} />} title="Not found" body={message} actionLabel="Go to Home" onAction={() => router.replace('/')} />
    </Screen>
  );
}
