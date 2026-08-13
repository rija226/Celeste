import { Ionicons } from '@expo/vector-icons';
import { Paragraph, XStack, YStack } from 'tamagui';

import { GlassCard } from '@/components/GlassCard';
import { palette } from '@/theme/palette';

export function StatTile({
  icon,
  value,
  valueSuffix,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  valueSuffix?: string;
  label: string;
  color: string;
}) {
  return (
    <GlassCard f={1} p={16} borderRadius={18} gap={8}>
      <YStack width={36} height={36} borderRadius={999} ai="center" jc="center" backgroundColor={`${color}26`}>
        <Ionicons name={icon} size={18} color={color} />
      </YStack>
      <XStack ai="baseline" gap={2}>
        <Paragraph fontFamily="$heading" fontSize={32} fontWeight="700" lineHeight={32} color={palette.starlight}>
          {value}
        </Paragraph>
        {valueSuffix && (
          <Paragraph fontFamily="$heading" fontSize={18} color={palette.haze}>
            {valueSuffix}
          </Paragraph>
        )}
      </XStack>
      <Paragraph fontSize={12} color="#A5A5A5">
        {label}
      </Paragraph>
    </GlassCard>
  );
}
