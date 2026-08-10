import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Paragraph, YStack } from 'tamagui';

import { pickLocalized } from '@/lib/localized';
import type { Card } from '@/types/models';

export function LinkedFact({ card }: { card: Card }) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <YStack pressStyle={{ opacity: 0.7 }} onPress={() => setExpanded((value) => !value)}>
      <Paragraph color="$blue10" fontSize="$2" fontWeight="600">
        {t('tonight.funFact')}
      </Paragraph>
      {expanded && (
        <Paragraph color="$color11" fontSize="$2">
          {pickLocalized(card.back, i18n.language)}
        </Paragraph>
      )}
    </YStack>
  );
}
