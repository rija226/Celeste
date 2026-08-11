import { useRef } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Line } from 'react-native-svg';
import { Paragraph, ScrollView, YStack } from 'tamagui';

import { LevelNode, type LevelNodeState } from '@/components/LevelNode';
import { palette } from '@/theme/palette';
import type { Deck } from '@/types/models';

const NODE_SIZE = 84;
const ROW_HEIGHT = 180;
const AMPLITUDE = 70;
const TOP_FADE_HEIGHT = 120;
const PATH_WIDTH = NODE_SIZE + AMPLITUDE * 2 + 40;
const CENTER_X = PATH_WIDTH / 2;

// decks su vec sortirani po level-u (rastuce); currentIndex je prvi deck
// ciji xpRequired jos nije dostignut -- sve prije njega je zavrseno, sve
// poslije zakljucano. -1 znaci da su svi dosadasnji nivoi zavrseni.
function levelState(index: number, currentIndex: number): LevelNodeState {
  if (currentIndex === -1 || index < currentIndex) return 'completed';
  if (index === currentIndex) return 'current';
  return 'locked';
}

export function LevelPath({ decks, totalXp }: { decks: Deck[]; totalXp: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const sorted = decks
    .filter((deck) => deck.level !== null)
    .sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
  const currentIndex = sorted.findIndex((deck) => totalXp < deck.xpRequired);
  const totalHeight = TOP_FADE_HEIGHT + sorted.length * ROW_HEIGHT;

  const positions = sorted.map((deck, index) => {
    const rowFromTop = sorted.length - 1 - index;
    return {
      deck,
      x: CENTER_X + (index % 2 === 0 ? -AMPLITUDE : AMPLITUDE),
      y: TOP_FADE_HEIGHT + rowFromTop * ROW_HEIGHT + ROW_HEIGHT / 2,
      state: levelState(index, currentIndex),
    };
  });

  return (
    <ScrollView
      ref={scrollRef}
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      contentContainerStyle={{ alignItems: 'center', paddingBottom: 48 }}>
      <Paragraph color="$color11" fontSize="$2" mt="$4" mb="$2" opacity={0.6}>
        {t('home.pathContinues')}
      </Paragraph>
      <YStack width={PATH_WIDTH} height={totalHeight} position="relative">
        <Svg width={PATH_WIDTH} height={totalHeight} style={{ position: 'absolute' }}>
          {positions.slice(0, -1).map((point, index) => {
            const next = positions[index + 1];
            const active = point.state === 'completed';
            return (
              <Line
                key={point.deck.id}
                x1={point.x}
                y1={point.y}
                x2={next.x}
                y2={next.y}
                stroke={active ? palette.aurora : palette.nebulaDeep}
                strokeWidth={5}
                strokeLinecap="round"
                strokeOpacity={active ? 0.9 : 0.6}
              />
            );
          })}
        </Svg>
        {positions.map((point) => (
          <LevelNode
            key={point.deck.id}
            deck={point.deck}
            state={point.state}
            x={point.x}
            y={point.y}
            xpProgress={point.state === 'current' ? { current: totalXp, total: point.deck.xpRequired } : undefined}
            onPress={() => router.push(`/deck/${point.deck.id}`)}
          />
        ))}
      </YStack>
    </ScrollView>
  );
}
