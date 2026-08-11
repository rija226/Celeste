import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Paragraph, YStack } from 'tamagui';

import { pickLocalized } from '@/lib/localized';
import { palette } from '@/theme/palette';
import type { Deck } from '@/types/models';

export type LevelNodeState = 'completed' | 'current' | 'locked';

const NODE_SIZE = 84;

export function LevelNode({
  deck,
  state,
  x,
  y,
  xpProgress,
  onPress,
}: {
  deck: Deck;
  state: LevelNodeState;
  x: number;
  y: number;
  xpProgress?: { current: number; total: number };
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation();
  const locked = state === 'locked';

  return (
    <YStack position="absolute" left={x - NODE_SIZE / 2} top={y - NODE_SIZE / 2} width={NODE_SIZE} alignItems="center" gap="$2">
      <YStack
        width={NODE_SIZE}
        height={NODE_SIZE}
        borderRadius={999}
        alignItems="center"
        justifyContent="center"
        backgroundColor={locked ? palette.nebulaDeep : state === 'current' ? palette.nebula : palette.aurora}
        borderWidth={state === 'current' ? 3 : 1}
        borderColor={state === 'current' ? palette.starlight : locked ? palette.haze : palette.nebula}
        opacity={locked ? 0.45 : 1}
        shadowColor={palette.nebula}
        shadowOpacity={state === 'current' ? 0.7 : 0}
        shadowRadius={state === 'current' ? 20 : 0}
        shadowOffset={{ width: 0, height: 0 }}
        {...(!locked && { onPress, pressStyle: { opacity: 0.8 } })}>
        {locked ? (
          <Ionicons name="lock-closed" size={28} color={palette.haze} />
        ) : (
          <Paragraph fontSize={36}>{deck.emoji ?? '⭐'}</Paragraph>
        )}
        {state === 'completed' && (
          <YStack
            position="absolute"
            top={-6}
            right={-6}
            width={26}
            height={26}
            borderRadius={999}
            backgroundColor={palette.comet}
            alignItems="center"
            justifyContent="center"
            borderWidth={2}
            borderColor={palette.void}>
            <Ionicons name="star" size={14} color={palette.starlight} />
          </YStack>
        )}
      </YStack>
      <Paragraph
        fontFamily="$heading"
        fontSize="$2"
        color={locked ? '$color11' : '$color'}
        textAlign="center"
        numberOfLines={2}
        opacity={locked ? 0.5 : 1}>
        {pickLocalized(deck.name, i18n.language)}
      </Paragraph>
      {xpProgress && (
        <YStack width={NODE_SIZE} gap="$1" alignItems="center">
          <YStack height={5} width="100%" borderRadius={999} backgroundColor={palette.nebulaDeep} overflow="hidden">
            <YStack
              height={5}
              width={`${Math.min(100, Math.round((xpProgress.current / Math.max(xpProgress.total, 1)) * 100))}%`}
              borderRadius={999}
              backgroundColor={palette.nebula}
            />
          </YStack>
          <Paragraph fontSize="$1" color="$color11" textAlign="center">
            {t('home.xpProgress', { current: xpProgress.current, total: xpProgress.total })}
          </Paragraph>
        </YStack>
      )}
    </YStack>
  );
}
