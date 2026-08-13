import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { Paragraph, YStack } from 'tamagui';

import { XpRing } from '@/components/XpRing';
import { pickLocalized } from '@/lib/localized';
import { palette } from '@/theme/palette';
import type { Deck } from '@/types/models';

export type LevelNodeState = 'completed' | 'current' | 'locked';

const NODE_SIZE = 84;
// Naziv nivoa ima siri prostor od samog kruga -- na 84px se dulje rijeci
// (npr. "Unutrasnje") prelamaju usred rijeci umjesto na razmaku izmedju
// rijeci. Krug ostaje NODE_SIZE, samo tekst dobija vise mjesta oko sebe.
const LABEL_WIDTH = 112;

const CURRENT_CONTAINER_SIZE = 108;
const CURRENT_RING_SIZE = 100;
const CURRENT_RING_STROKE = 5;
const CURRENT_RING_TRACK = 'rgba(23,19,52,0.9)';

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
  const current = state === 'current';
  const containerSize = current ? CURRENT_CONTAINER_SIZE : NODE_SIZE;

  return (
    <YStack
      position="absolute"
      left={x - LABEL_WIDTH / 2}
      top={y - containerSize / 2}
      width={LABEL_WIDTH}
      alignItems="center"
      gap="$2">
      {current ? (
        <YStack width={CURRENT_CONTAINER_SIZE} height={CURRENT_CONTAINER_SIZE} ai="center" jc="center">
          {/* Halo -- radial-gradient nema RN ekvivalent, aproksimira se sa 2
              koncentricna poluprozirna kruga (shadow je nepouzdan na Androidu). */}
          <YStack
            position="absolute"
            width={CURRENT_CONTAINER_SIZE}
            height={CURRENT_CONTAINER_SIZE}
            borderRadius={999}
            backgroundColor="rgba(124,108,255,0.18)"
          />
          <YStack
            position="absolute"
            width={CURRENT_CONTAINER_SIZE * 0.78}
            height={CURRENT_CONTAINER_SIZE * 0.78}
            borderRadius={999}
            backgroundColor="rgba(124,108,255,0.26)"
          />
          <YStack position="absolute" width={CURRENT_RING_SIZE} height={CURRENT_RING_SIZE}>
            <XpRing
              size={CURRENT_RING_SIZE}
              strokeWidth={CURRENT_RING_STROKE}
              fraction={xpProgress ? xpProgress.current / Math.max(xpProgress.total, 1) : 0}
              color={palette.nebula}
              trackColor={CURRENT_RING_TRACK}
            />
          </YStack>
          <YStack
            width={CURRENT_RING_SIZE - CURRENT_RING_STROKE * 2}
            height={CURRENT_RING_SIZE - CURRENT_RING_STROKE * 2}
            borderRadius={999}
            backgroundColor={palette.surface}
            borderWidth={2}
            borderColor={palette.starlight}
            alignItems="center"
            justifyContent="center"
            onPress={onPress}
            pressStyle={{ opacity: 0.85 }}>
            <Text style={{ fontSize: 40 }}>{deck.emoji ?? '⭐'}</Text>
          </YStack>
        </YStack>
      ) : (
        <YStack
          width={NODE_SIZE}
          height={NODE_SIZE}
          borderRadius={999}
          alignItems="center"
          justifyContent="center"
          backgroundColor={locked ? palette.nebulaDeep : palette.aurora}
          borderWidth={1}
          borderColor={locked ? palette.haze : palette.nebula}
          opacity={locked ? 0.5 : 1}
          {...(!locked && { onPress, pressStyle: { opacity: 0.8 } })}>
          {locked ? (
            <Ionicons name="lock-closed" size={28} color={palette.haze} />
          ) : (
            // Obican RN Text bez custom fontFamily -- Tamagui Paragraph
            // nasljedjuje Inter (ucitan Google Font), a na Androidu custom
            // fontFamily zna sprijeciti ispravan fallback na sistemski emoji
            // font, pa se emoji renderuje krivo/deformisano.
            <Text style={{ fontSize: 38 }}>{deck.emoji ?? '⭐'}</Text>
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
      )}
      <Paragraph
        fontFamily="$heading"
        fontSize={current ? 13 : '$2'}
        fontWeight={current ? '600' : undefined}
        color={locked ? '$color11' : '$color'}
        textAlign="center"
        numberOfLines={2}
        opacity={locked ? 0.5 : 1}>
        {pickLocalized(deck.name, i18n.language)}
      </Paragraph>
      {xpProgress && (
        <Paragraph fontSize={11} fontWeight="600" color={palette.nebula} textAlign="center">
          {t('home.xpProgress', { current: xpProgress.current, total: xpProgress.total })}
        </Paragraph>
      )}
    </YStack>
  );
}
