import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { Paragraph, XStack } from 'tamagui';

import { palette } from '@/theme/palette';

type PillButtonProps = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
};

export function PillButton({ label, icon, color, onPress }: PillButtonProps) {
  const textColor = color === palette.amber ? palette.void : palette.starlight;
  return (
    <Pressable onPress={onPress}>
      <XStack height={50} borderRadius={999} backgroundColor={color} ai="center" jc="center" gap="$2">
        <Paragraph fontWeight="700" fontSize={15} color={textColor}>
          {label}
        </Paragraph>
        {icon && <Ionicons name={icon} size={16} color={textColor} />}
      </XStack>
    </Pressable>
  );
}
