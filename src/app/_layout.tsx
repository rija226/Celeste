import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { TamaguiProvider } from 'tamagui';

import { SpaceBackdrop } from '@/components/SpaceBackdrop';
import { ensureSession } from '@/db';
import { initI18n } from '@/i18n';
import { palette } from '@/theme/palette';
import { tamaguiConfig } from '@/theme/tamagui.config';
import { useAppFonts } from '@/theme/fonts';

export default function RootLayout() {
  const fontsLoaded = useAppFonts();
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    Promise.all([initI18n(), ensureSession()]).then(() => setDataReady(true));
  }, []);

  if (!fontsLoaded || !dataReady) {
    return null;
  }

  return (
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
    </TamaguiProvider>
  );
}
