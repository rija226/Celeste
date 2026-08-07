import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { TamaguiProvider } from 'tamagui';

import { initI18n } from '@/i18n';
import { tamaguiConfig } from '@/theme/tamagui.config';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setReady(true));
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
      <Stack screenOptions={{ headerShown: false }} />
    </TamaguiProvider>
  );
}
