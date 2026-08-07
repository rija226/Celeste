import { YStack, type YStackProps } from 'tamagui';

import { palette } from '@/theme/palette';

export function GlassCard(props: YStackProps) {
  return (
    <YStack
      backgroundColor="rgba(23,19,52,0.55)"
      borderColor={palette.nebulaDeep}
      borderWidth={1}
      borderRadius="$6"
      p="$4"
      {...props}
    />
  );
}
