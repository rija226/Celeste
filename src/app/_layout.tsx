import { Stack } from 'expo-router';
import { TamaguiProvider } from 'tamagui';

import { tamaguiConfig } from '@/theme/tamagui.config';

export default function RootLayout() {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
      <Stack screenOptions={{ headerShown: false }} />
    </TamaguiProvider>
  );
}
