import { config } from '@tamagui/config';
import { createTamagui } from 'tamagui';

export const tamaguiConfig = createTamagui(config);

type AppConfig = typeof tamaguiConfig;

declare module '@tamagui/web' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- declaration merging, not a real empty type
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
