import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { Paragraph, XStack, YStack } from 'tamagui';

import { getRankKey } from '@/lib/rank';
import { useProfileStore } from '@/store/profile';
import { ACCENT_COLORS } from '@/theme/accent';
import { palette } from '@/theme/palette';

const SUB_INK = '#C9C4EC';

export function ProfileHeader({
  level,
  streak,
  unlockedLevels,
  totalLevels,
  onPress,
}: {
  level: number;
  streak: number;
  unlockedLevels: number;
  totalLevels: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const glyph = useProfileStore((s) => s.glyph);
  const accent = useProfileStore((s) => s.accent);
  const name = useProfileStore((s) => s.name);
  const accentColor = ACCENT_COLORS[accent];
  const rankLabel = t(`profile.rank.${getRankKey(level)}`);

  return (
    <YStack
      position="relative"
      overflow="hidden"
      borderRadius={22}
      p={18}
      borderWidth={1}
      borderColor="rgba(124,108,255,0.5)"
      shadowColor={palette.nebula}
      shadowOpacity={0.22}
      shadowRadius={20}
      shadowOffset={{ width: 0, height: 10 }}
      onPress={onPress}
      pressStyle={{ opacity: 0.9 }}>
      <LinearGradient
        colors={['rgba(124,108,255,0.3)', 'rgba(43,37,96,0.92)']}
        locations={[0, 0.6]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <XStack ai="center" gap={14}>
        <YStack width={72} height={72}>
          <YStack
            position="absolute"
            width={72}
            height={72}
            borderRadius={999}
            backgroundColor={`${accentColor}40`}
          />
          <YStack
            position="absolute"
            top={2}
            left={2}
            width={68}
            height={68}
            borderRadius={999}
            backgroundColor="#120f2e"
            borderWidth={2}
            borderColor={accentColor}
            ai="center"
            jc="center">
            <Text style={{ fontSize: 36 }}>{glyph}</Text>
          </YStack>
          <YStack
            position="absolute"
            bottom={-2}
            right={-2}
            width={26}
            height={26}
            borderRadius={999}
            backgroundColor={accentColor}
            borderWidth={2}
            borderColor="#120f2e"
            ai="center"
            jc="center">
            <Ionicons name="pencil" size={12} color={palette.starlight} />
          </YStack>
        </YStack>

        <YStack f={1} gap={3}>
          <Paragraph fontFamily="$heading" fontSize={20} fontWeight="700" color={palette.starlight}>
            {name || t('profile.explorerFallback')}
          </Paragraph>
          <Paragraph fontSize={12} fontWeight="600" letterSpacing={0.4} color={SUB_INK}>
            {t('profile.levelRank', { level, rank: rankLabel })}
          </Paragraph>
          <XStack gap={8} mt={4}>
            <XStack
              ai="center"
              gap={4}
              px={9}
              py={3}
              borderRadius={999}
              backgroundColor="rgba(255,107,94,0.15)"
              borderWidth={1}
              borderColor="rgba(255,107,94,0.5)">
              <Text style={{ fontSize: 12 }}>🔥</Text>
              <Paragraph fontSize={11} fontWeight="600" color={palette.comet}>
                {streak}
              </Paragraph>
            </XStack>
            <XStack
              ai="center"
              gap={4}
              px={9}
              py={3}
              borderRadius={999}
              backgroundColor="rgba(51,214,176,0.15)"
              borderWidth={1}
              borderColor="rgba(51,214,176,0.5)">
              <Ionicons name="rocket" size={12} color={palette.aurora} />
              <Paragraph fontSize={11} fontWeight="600" color={palette.aurora}>
                {t('profile.unlockedLevels', { unlocked: unlockedLevels, total: totalLevels })}
              </Paragraph>
            </XStack>
          </XStack>
        </YStack>
      </XStack>
    </YStack>
  );
}
