import { router } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { ScrollView } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Screen } from '@/components/primitives';
import { SettingsRow, SettingsSection } from '@/components/SettingsRows';
import { colors, space } from '@/theme/tokens';

export default function MoreScreen() {
  return (
    <Screen>
      <AppHeader title="More" back={false} />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.xl }}>
        <SettingsSection>
          <SettingsRow title="Settings" subtitle="Tax, pricing and app data" icon={<Settings size={22} color={colors.textSecondary} />} onPress={() => router.push('/settings')} />
        </SettingsSection>
      </ScrollView>
    </Screen>
  );
}
