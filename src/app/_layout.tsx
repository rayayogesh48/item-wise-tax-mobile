import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SuccessToast } from '@/components/SuccessToast';
import { useAppStore } from '@/store/useAppStore';
import { colors, size, space, type } from '@/theme/tokens';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  const hydrated = useAppStore((s) => s.hydrated);
  const storageError = useAppStore((s) => s.storageError);
  const ready = (fontsLoaded || fontError) && hydrated;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {/* On wide screens (web) the app stays phone-sized and centred. */}
      <View style={styles.backdrop}>
        <View style={styles.frame}>
          {ready ? (
            <>
              {storageError ? (
                <Text style={styles.warning} accessibilityRole="alert">
                  Saved data could not be loaded. Showing demo data; changes may not be kept.
                </Text>
              ) : null}
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
              <SuccessToast />
            </>
          ) : (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#eceaf0', alignItems: 'center' },
  frame: { flex: 1, width: '100%', maxWidth: size.maxWidth, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  warning: { ...type.bodySm, color: colors.danger, backgroundColor: colors.dangerSoft, padding: space.md, paddingTop: space.xxl },
});
