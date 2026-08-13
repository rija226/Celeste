import Svg, { Circle } from 'react-native-svg';

type XpRingProps = {
  size: number;
  strokeWidth: number;
  fraction: number;
  color: string;
  trackColor: string;
};

// Zamjena za CSS conic-gradient (RN/SVG nema conic) -- puna kruzna traka +
// oboje 'progres' luk preko strokeDasharray/rotacije. Pocinje na 12h kao i
// conic-gradient (rotacija -90deg), ide u smjeru kazaljke.
export function XpRing({ size, strokeWidth, fraction, color, trackColor }: XpRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressLength = Math.max(0, Math.min(1, fraction)) * circumference;

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
      {progressLength > 0 && (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${progressLength} ${circumference}`}
          strokeLinecap="round"
        />
      )}
    </Svg>
  );
}
