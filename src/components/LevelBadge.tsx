import { useTranslation } from 'react-i18next';
import { Paragraph, YStack } from 'tamagui';

import { GlassCard } from '@/components/GlassCard';
import type { LevelInfo } from '@/lib/level';
import { palette } from '@/theme/palette';

export function LevelBadge({ info }: { info: LevelInfo }) {
  const { t } = useTranslation();
  const progress = info.xpForNextLevel === 0 ? 1 : info.xpIntoLevel / info.xpForNextLevel;

  return (
    <GlassCard gap="$2">
      <Paragraph fontFamily="$heading" fontSize="$7" color="$blue10">
        {t('home.level', { level: info.level })}
      </Paragraph>
      <YStack height={8} borderRadius={999} backgroundColor={palette.nebulaDeep} overflow="hidden">
        <YStack height={8} width={`${Math.round(progress * 100)}%`} borderRadius={999} backgroundColor={palette.nebula} />
      </YStack>
      <Paragraph color="$color11" fontSize="$2">
        {t('home.xpProgress', { current: info.xpIntoLevel, total: info.xpForNextLevel })}
      </Paragraph>
    </GlassCard>
  );
}
