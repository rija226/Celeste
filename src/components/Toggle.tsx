import { Pressable } from 'react-native';
import { YStack } from 'tamagui';

import { palette } from '@/theme/palette';

type ToggleProps = {
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
};

export function Toggle({ value, disabled, onValueChange }: ToggleProps) {
  return (
    <Pressable disabled={disabled} onPress={() => onValueChange(!value)}>
      <YStack
        width={52}
        height={30}
        borderRadius={999}
        borderWidth={1}
        borderColor={value ? palette.nebula : palette.haze}
        backgroundColor={value ? palette.nebula : palette.nebulaDeep}
        p={3}
        opacity={disabled ? 0.4 : 1}
        jc="center"
        ai={value ? 'flex-end' : 'flex-start'}>
        <YStack width={22} height={22} borderRadius={999} backgroundColor={palette.starlight} />
      </YStack>
    </Pressable>
  );
}
