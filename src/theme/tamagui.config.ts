import { config } from '@tamagui/config';
import { createTamagui } from 'tamagui';

import { bodyFaceByWeight, headingFaceByWeight } from './fonts';
import { palette } from './palette';

// Klonira postojecu Tamagui font konfiguraciju (velicine/lineHeight/weight
// skala ostaju iste) i samo mijenja family/face na nase ucitane fontove.
function withFace<F extends { face?: Record<string, { normal?: string; italic?: string }> }>(
  font: F,
  faceByWeight: Record<string, string>,
): F {
  return {
    ...font,
    family: faceByWeight['400'],
    face: Object.fromEntries(
      Object.keys(font.face ?? {}).map((weight) => [
        weight,
        { normal: faceByWeight[weight] ?? faceByWeight['400'] },
      ]),
    ) as F['face'],
  };
}

const fonts = {
  ...config.fonts,
  // Stock Tamagui headingFont baca textTransform:'uppercase' na manje
  // size-indekse (vidi @tamagui/config/dist/.../fonts.js: transform: {6:
  // 'uppercase', 7:'none'}) -- to se resolveuje i za literalni fontSize broj,
  // ne samo "$N" token, pa je npr. "Good evening"/"New Moon" tiho izlazio
  // velikim slovima bez ijednog eksplicitnog textTransform propa u kodu.
  // Ovdje ga brisemo; gdje NAM treba uppercase, postavljamo ga eksplicitno.
  heading: { ...withFace(config.fonts.heading, headingFaceByWeight), transform: {} },
  body: withFace(config.fonts.body, bodyFaceByWeight),
};

const themes = {
  ...config.themes,
  dark: {
    ...config.themes.dark,
    background: palette.void,
    color: palette.starlight,
    placeholderColor: palette.haze,
    borderColor: palette.nebulaDeep,
  },
};

export const tamaguiConfig = createTamagui({
  ...config,
  fonts,
  themes,
});

type AppConfig = typeof tamaguiConfig;

declare module '@tamagui/web' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- declaration merging, not a real empty type
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
