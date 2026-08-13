import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Paragraph, XStack, YStack } from 'tamagui';

import { pickLocalized } from '@/lib/localized';
import { palette } from '@/theme/palette';
import type { Card } from '@/types/models';

export function LinkedFact({ card }: { card: Card }) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <YStack gap="$1" pressStyle={{ opacity: 0.7 }} onPress={() => setExpanded((value) => !value)}>
      <XStack ai="center" gap={4}>
        <Ionicons name="bulb-outline" size={13} color={palette.aurora} />
        <Paragraph color={palette.aurora} fontSize={12} fontWeight="600">
          {t('tonight.funFact')}
        </Paragraph>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={13} color={palette.aurora} />
      </XStack>
      {expanded && (
        <Paragraph color="#A5A5A5" fontSize={13}>
          {pickLocalized(card.back, i18n.language)}
        </Paragraph>
      )}
    </YStack>
  );
}
