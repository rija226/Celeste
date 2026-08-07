import { useTranslation } from 'react-i18next';
import { H2, YStack } from 'tamagui';

export default function StatsScreen() {
  const { t } = useTranslation();

  return (
    <YStack f={1} ai="center" jc="center" bg="$background">
      <H2 color="$color">{t('stats.title')}</H2>
    </YStack>
  );
}
