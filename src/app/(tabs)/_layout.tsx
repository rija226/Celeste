import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('home.title') }} />
      <Tabs.Screen name="stats" options={{ title: t('stats.title') }} />
    </Tabs>
  );
}
