import { useTranslation } from 'react-i18next';
import { Button, H2, YStack } from 'tamagui';

import { changeLanguage } from '@/i18n';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();

  return (
    <YStack f={1} ai="center" jc="center" gap="$3" bg="$background">
      <H2 color="$color">{t('home.title')}</H2>
      <Button onPress={() => changeLanguage(i18n.language === 'en' ? 'hr' : 'en')}>
        {t('common.switchLanguage')}
      </Button>
    </YStack>
  );
}
