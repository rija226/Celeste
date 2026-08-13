import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Paragraph, YStack } from 'tamagui';

import { GlassCard } from '@/components/GlassCard';
import { pickLocalized } from '@/lib/localized';
import { palette } from '@/theme/palette';
import type { Deck } from '@/types/models';

const CAPTION_COLOR = '#A5A5A5';

type ResumeDockProps = {
  deck: Deck;
  totalXp: number;
  xpRequired: number;
  dueCount: number;
  onPress: () => void;
};

export function ResumeDock({ deck, totalXp, xpRequired, dueCount, onPress }: ResumeDockProps) {
  const { t, i18n } = useTranslation();
  const fraction = Math.max(0, Math.min(1, xpRequired > 0 ? totalXp / xpRequired : 1));

  return (
    <GlassCard
      flexDirection="row"
      alignItems="center"
      gap="$3"
      p="$3"
      borderRadius={22}
      backgroundColor="rgba(43,37,96,0.94)"
      borderColor="rgba(124,108,255,0.55)"
      shadowColor={palette.nebula}
      shadowOpacity={0.3}
      shadowRadius={20}
      shadowOffset={{ width: 0, height: 10 }}>
      <YStack width={48} height={48} borderRadius={15} backgroundColor="rgba(124,108,255,0.22)" ai="center" jc="center">
        <Text style={{ fontSize: 26 }}>{deck.emoji ?? '⭐'}</Text>
      </YStack>

      <YStack f={1} gap="$1.5">
        <Paragraph fontFamily="$heading" fontSize={15} fontWeight="600" color={palette.starlight} numberOfLines={1}>
          {t('home.resumeContinue', { name: pickLocalized(deck.name, i18n.language) })}
        </Paragraph>
        <YStack height={6} borderRadius={999} backgroundColor="rgba(6,7,13,0.5)" overflow="hidden">
          <LinearGradient
            colors={[palette.nebula, palette.aurora]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 6, width: `${fraction * 100}%`, borderRadius: 999 }}
          />
        </YStack>
        <Paragraph fontSize={12} color={CAPTION_COLOR}>
          {t('deck.dueCount', { count: dueCount })}
        </Paragraph>
      </YStack>

      <Pressable onPress={onPress} hitSlop={8}>
        <YStack width={46} height={46} borderRadius={999} backgroundColor={palette.aurora} ai="center" jc="center">
          <Ionicons name="play" size={20} color={palette.void} />
        </YStack>
      </Pressable>
    </GlassCard>
  );
}
