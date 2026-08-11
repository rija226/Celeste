import { Ionicons } from '@expo/vector-icons';
import { Paragraph, YStack } from 'tamagui';

export function StatTile({
  icon,
  value,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <YStack
      f={1}
      backgroundColor="rgba(43,37,96,0.9)"
      borderColor="rgba(124,108,255,0.5)"
      borderWidth={1}
      borderRadius="$6"
      p="$4"
      gap="$2">
      <YStack width={36} height={36} borderRadius={999} ai="center" jc="center" backgroundColor={`${color}26`}>
        <Ionicons name={icon} size={18} color={color} />
      </YStack>
      <Paragraph fontFamily="$heading" fontSize="$8" color={color}>
        {value}
      </Paragraph>
      <Paragraph fontSize="$2" color="$color11">
        {label}
      </Paragraph>
    </YStack>
  );
}
