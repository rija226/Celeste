import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';

import { CelebrationToast } from '@/components/CelebrationToast';
import { SpaceBackdrop } from '@/components/SpaceBackdrop';
import { WelcomeModal } from '@/components/WelcomeModal';
import { ensureSession } from '@/db';
import { initI18n } from '@/i18n';
import { hasSeenWelcome, markWelcomeSeen } from '@/lib/welcome';
import { palette } from '@/theme/palette';
import { tamaguiConfig } from '@/theme/tamagui.config';
import { useAppFonts } from '@/theme/fonts';

export default function RootLayout() {
  const fontsLoaded = useAppFonts();
  const [dataReady, setDataReady] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    Promise.all([initI18n(), ensureSession()]).then(() => setDataReady(true));
    hasSeenWelcome().then((seen) => setShowWelcome(!seen));
  }, []);

  if (!fontsLoaded || !dataReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
        <SpaceBackdrop />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: 'transparent' },
            headerStyle: { backgroundColor: palette.nebulaDeep },
            headerTintColor: palette.starlight,
          }}
        />
        <WelcomeModal
          visible={showWelcome}
          onDismiss={() => {
            setShowWelcome(false);
            markWelcomeSeen();
          }}
        />
        <CelebrationToast />
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}
