import Svg, { Circle, Line } from 'react-native-svg';

import { palette } from '@/theme/palette';
import type { ConstellationLine, ConstellationStar } from '@/types/models';

type ConstellationViewProps = {
  stars: ConstellationStar[];
  lines: ConstellationLine[];
  size?: number;
  glow?: boolean;
};

// Zvijezde/linije su normalizovane na 0-100 viewBox, pa ovaj prikaz radi
// za bilo koju velicinu bez ponovnog racunanja koordinata.
export function ConstellationView({ stars, lines, size = 220, glow = false }: ConstellationViewProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {lines.map(([a, b], index) => (
        <Line
          key={index}
          x1={stars[a].x}
          y1={stars[a].y}
          x2={stars[b].x}
          y2={stars[b].y}
          stroke={palette.nebula}
          strokeWidth={1.2}
          strokeOpacity={0.8}
        />
      ))}
      {glow &&
        stars.map((star, index) => (
          <Circle key={`glow-${index}`} cx={star.x} cy={star.y} r={5} fill={palette.nebula} opacity={0.25} />
        ))}
      {stars.map((star, index) => (
        <Circle key={index} cx={star.x} cy={star.y} r={2.4} fill={palette.starlight} />
      ))}
    </Svg>
  );
}
