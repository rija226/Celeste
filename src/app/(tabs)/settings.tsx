import { useTranslation } from 'react-i18next';
import { Button, H2, Paragraph, XStack, YStack } from 'tamagui';

import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { changeLanguage } from '@/i18n';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();

  return (
    <ScreenBackdrop>
      <YStack f={1} pt="$8" px="$4" gap="$4">
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
      </YStack>
    </ScreenBackdrop>
  );
}
