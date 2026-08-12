import { useEffect, useState } from 'react';
import { Platform, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, H2, Paragraph, XStack, YStack } from 'tamagui';

import { AccountSection } from '@/components/AccountSection';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { Toggle } from '@/components/Toggle';
import { changeLanguage } from '@/i18n';
import { isDailyReminderEnabled, setDailyReminderEnabled } from '@/lib/notifications';
import { useSoundStore } from '@/store/sound';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const sfxEnabled = useSoundStore((s) => s.sfxEnabled);
  const ambientEnabled = useSoundStore((s) => s.ambientEnabled);
  const setSfxEnabled = useSoundStore((s) => s.setSfxEnabled);
  const setAmbientEnabled = useSoundStore((s) => s.setAmbientEnabled);

  useEffect(() => {
    isDailyReminderEnabled().then(setReminderEnabled);
  }, []);

  async function handleToggleReminder(next: boolean) {
    const actual = await setDailyReminderEnabled(next, {
      title: t('notifications.reminderTitle'),
      body: t('notifications.reminderBody'),
    });
    setReminderEnabled(actual);
    setPermissionDenied(next && !actual && Platform.OS !== 'web');
  }

  return (
    <ScreenBackdrop>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack f={1} pt="$8" px="$4" pb="$8" gap="$4">
          <H2 color="$color">{t('settings.title')}</H2>

          <YStack gap="$2">
            <Paragraph color="$color11">{t('settings.language')}</Paragraph>
            <XStack gap="$2">
              <Button
                f={1}
                theme={i18n.language === 'en' ? 'blue' : undefined}
                onPress={() => changeLanguage('en')}>
                English
              </Button>
              <Button
                f={1}
                theme={i18n.language === 'hr' ? 'blue' : undefined}
                onPress={() => changeLanguage('hr')}>
                Hrvatski
              </Button>
            </XStack>
          </YStack>

          <YStack gap="$2">
            <XStack ai="center" jc="space-between">
              <Paragraph color="$color11">{t('settings.dailyReminder')}</Paragraph>
              <Toggle value={reminderEnabled} disabled={Platform.OS === 'web'} onValueChange={handleToggleReminder} />
            </XStack>
            {Platform.OS === 'web' ? (
              <Paragraph fontSize="$2" color="$color11">
                {t('settings.dailyReminderWebNote')}
              </Paragraph>
            ) : reminderEnabled ? (
              <Paragraph fontSize="$2" color="$color11">
                {t('settings.dailyReminderTime')}
              </Paragraph>
            ) : permissionDenied ? (
              <Paragraph fontSize="$2" color="$red10">
                {t('settings.dailyReminderDeniedNote')}
              </Paragraph>
            ) : null}
          </YStack>

          <YStack gap="$2">
            <Paragraph color="$color11">{t('settings.sound.title')}</Paragraph>
            <XStack ai="center" jc="space-between">
              <Paragraph color="$color">{t('settings.sound.sfx')}</Paragraph>
              <Toggle value={sfxEnabled} onValueChange={setSfxEnabled} />
            </XStack>
            <XStack ai="center" jc="space-between">
              <Paragraph color="$color">{t('settings.sound.ambient')}</Paragraph>
              <Toggle value={ambientEnabled} onValueChange={setAmbientEnabled} />
            </XStack>
          </YStack>

          <AccountSection />
        </YStack>
      </ScrollView>
    </ScreenBackdrop>
  );
}
