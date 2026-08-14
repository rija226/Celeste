import { palette } from '@/theme/palette';
import type { AccentName } from '@/store/profile';

export const ACCENT_OPTIONS: AccentName[] = ['nebula', 'aurora', 'comet', 'amber'];

export const ACCENT_COLORS: Record<AccentName, string> = {
  nebula: palette.nebula,
  aurora: palette.aurora,
  comet: palette.comet,
  amber: palette.amber,
};
