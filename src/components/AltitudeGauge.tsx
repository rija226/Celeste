import Svg, { Circle, Line, Path } from 'react-native-svg';

const TRACK_COLOR = 'rgba(141,138,174,0.35)';

type AltitudeGaugeProps = {
  altitude: number;
  color: string;
  width?: number;
  height?: number;
};

// Cisto indikativan mini-gauge: horizont linija + cetvrt-luk (0-90deg) +
// tacka na poziciji tijela duz luka. Nije precizan instrument, samo vizuelni
// nagovjestaj "koliko visoko".
export function AltitudeGauge({ altitude, color, width = 40, height = 26 }: AltitudeGaugeProps) {
  const cx = width - 4;
  const cy = height - 2;
  const r = height - 6;
  const clampedAltitude = Math.max(0, Math.min(90, altitude));
  const angleRad = (clampedAltitude / 90) * (Math.PI / 2);
  const dotX = cx - r * Math.cos(angleRad);
  const dotY = cy - r * Math.sin(angleRad);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Line x1={cx - r - 2} y1={cy} x2={cx + 2} y2={cy} stroke={TRACK_COLOR} strokeWidth={1} strokeLinecap="round" />
      <Path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy - r}`} stroke={TRACK_COLOR} strokeWidth={1.5} fill="none" />
      <Circle cx={dotX} cy={dotY} r={3} fill={color} />
    </Svg>
  );
}
